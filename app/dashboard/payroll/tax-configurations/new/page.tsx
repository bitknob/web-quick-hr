"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Autocomplete, AutocompleteOption } from "@/components/ui/autocomplete";
import { ArrowLeft, Save, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { payrollApi, CreateTaxConfigurationRequest } from "@/lib/api/payroll";
import { companiesApi } from "@/lib/api/companies";
import { Company } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "@/lib/hooks/use-debounce";

const taxSlabSchema = z.object({
  from: z.number().min(0),
  to: z.number().nullable(),
  rate: z.number().min(0).max(100).optional(),
  amount: z.number().min(0).optional(),
});

const taxConfigurationSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().optional(),
  province: z.string().optional(),
  financialYear: z.string().min(1, "Financial year is required"),
  incomeTaxEnabled: z.boolean().optional(),
  incomeTaxSlabs: z.array(taxSlabSchema).optional(),
  socialSecurityEnabled: z.boolean().optional(),
  socialSecurityEmployerRate: z.number().min(0).max(100).optional(),
  socialSecurityEmployeeRate: z.number().min(0).max(100).optional(),
  socialSecurityMaxSalary: z.number().min(0).optional(),
  healthInsuranceEnabled: z.boolean().optional(),
  healthInsuranceEmployerRate: z.number().min(0).max(100).optional(),
  healthInsuranceEmployeeRate: z.number().min(0).max(100).optional(),
  healthInsuranceMaxSalary: z.number().min(0).optional(),
  professionalTaxEnabled: z.boolean().optional(),
  professionalTaxSlabs: z.array(taxSlabSchema).optional(),
  housingAllowanceExemptionRules: z.object({
    type: z.enum(["percentage_of_basic", "fixed_amount", "actual_rent"]),
    maxPercentage: z.number().optional(),
    minRentPercentage: z.number().optional(),
    amount: z.number().optional(),
  }).optional(),
  travelAllowanceExemptionRules: z.object({
    type: z.enum(["actual_expense", "fixed_amount", "percentage_of_basic"]),
    amount: z.number().optional(),
    percentage: z.number().optional(),
  }).optional(),
  standardDeduction: z.number().min(0).optional(),
  taxExemptions: z.record(z.string(), z.number()).optional(),
});

type TaxConfigurationFormData = z.infer<typeof taxConfigurationSchema>;

const countries = ["IN", "US", "UK", "CA", "AU", "SG"];

export default function NewTaxConfigurationPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<AutocompleteOption[]>([]);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(companySearchTerm, 300);
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["basic", "incomeTax", "socialSecurity", "healthInsurance", "professionalTax", "exemptions", "housingAllowance", "travelAllowance"])
  );

  const currentYear = new Date().getFullYear();
  const financialYear = `${currentYear}-${currentYear + 1}`;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TaxConfigurationFormData>({
    resolver: zodResolver(taxConfigurationSchema),
    defaultValues: {
      financialYear,
      incomeTaxEnabled: false,
      socialSecurityEnabled: false,
      healthInsuranceEnabled: false,
      professionalTaxEnabled: false,
      incomeTaxSlabs: [
        { from: 0, to: 250000, rate: 0 },
        { from: 250000, to: 500000, rate: 5 },
        { from: 500000, to: null, rate: 30 },
      ],
      professionalTaxSlabs: [
        { from: 0, to: 5000, amount: 0 },
        { from: 5000, to: 10000, amount: 150 },
        { from: 10000, to: null, amount: 200 },
      ],
      housingAllowanceExemptionRules: {
        type: "percentage_of_basic",
        maxPercentage: 50,
        minRentPercentage: 10,
      },
      travelAllowanceExemptionRules: {
        type: "actual_expense",
      },
      standardDeduction: 50000,
      taxExemptions: {
        section80C: 150000,
        section80D: 25000,
      },
    },
  });

  const {
    fields: incomeTaxSlabs,
    append: appendIncomeTaxSlab,
    remove: removeIncomeTaxSlab,
  } = useFieldArray({
    control,
    name: "incomeTaxSlabs",
  });

  const {
    fields: professionalTaxSlabs,
    append: appendProfessionalTaxSlab,
    remove: removeProfessionalTaxSlab,
  } = useFieldArray({
    control,
    name: "professionalTaxSlabs",
  });

  const companyId = watch("companyId");
  const incomeTaxEnabled = watch("incomeTaxEnabled");
  const socialSecurityEnabled = watch("socialSecurityEnabled");
  const healthInsuranceEnabled = watch("healthInsuranceEnabled");
  const professionalTaxEnabled = watch("professionalTaxEnabled");
  const housingAllowanceType = watch("housingAllowanceExemptionRules.type");
  const travelAllowanceType = watch("travelAllowanceExemptionRules.type");

  // Search companies
  const searchCompanies = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setCompanyOptions([]);
      return;
    }

    setIsSearchingCompanies(true);
    try {
      const response = await companiesApi.getCompanies({
        searchTerm,
        limit: 20,
        status: "active",
      });
      const options: AutocompleteOption[] = response.response.map((company: Company) => ({
        id: company.id,
        label: company.name,
        subtitle: `${company.code}${company.description ? ` - ${company.description}` : ""}`,
        imageUrl: company.profileImageUrl,
      }));
      setCompanyOptions(options);
    } catch {
      setCompanyOptions([]);
    } finally {
      setIsSearchingCompanies(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchCompanies(debouncedSearchTerm);
    } else {
      setCompanyOptions([]);
    }
  }, [debouncedSearchTerm, searchCompanies]);

  const handleCompanySelect = (option: AutocompleteOption | null) => {
    if (option) {
      setValue("companyId", option.id, { shouldValidate: true });
      setCompanySearchTerm(option.label);
    } else {
      setValue("companyId", "", { shouldValidate: true });
      setCompanySearchTerm("");
    }
  };

  const handleCompanySearch = (searchTerm: string) => {
    setCompanySearchTerm(searchTerm);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const addIncomeTaxSlab = () => {
    appendIncomeTaxSlab({ from: 0, to: null, rate: 0 });
  };

  const addProfessionalTaxSlab = () => {
    appendProfessionalTaxSlab({ from: 0, to: null, amount: 0 });
  };

  const onSubmit = async (data: TaxConfigurationFormData) => {
    setIsSaving(true);
    try {
      // Clean up optional fields - only include enabled sections
      const requestData: CreateTaxConfigurationRequest = {
        companyId: data.companyId,
        country: data.country,
        state: data.state,
        province: data.province,
        financialYear: data.financialYear,
      };

      if (data.incomeTaxEnabled && data.incomeTaxSlabs) {
        requestData.incomeTaxEnabled = true;
        requestData.incomeTaxSlabs = data.incomeTaxSlabs
          .filter((slab) => slab.rate !== undefined)
          .map((slab) => ({
            from: slab.from,
            to: slab.to,
            rate: slab.rate!,
          }));
      }

      if (data.socialSecurityEnabled) {
        requestData.socialSecurityEnabled = true;
        requestData.socialSecurityEmployerRate = data.socialSecurityEmployerRate;
        requestData.socialSecurityEmployeeRate = data.socialSecurityEmployeeRate;
        requestData.socialSecurityMaxSalary = data.socialSecurityMaxSalary;
      }

      if (data.healthInsuranceEnabled) {
        requestData.healthInsuranceEnabled = true;
        requestData.healthInsuranceEmployerRate = data.healthInsuranceEmployerRate;
        requestData.healthInsuranceEmployeeRate = data.healthInsuranceEmployeeRate;
        requestData.healthInsuranceMaxSalary = data.healthInsuranceMaxSalary;
      }

      if (data.professionalTaxEnabled && data.professionalTaxSlabs) {
        requestData.professionalTaxEnabled = true;
        requestData.professionalTaxSlabs = data.professionalTaxSlabs
          .filter((slab) => slab.amount !== undefined)
          .map((slab) => ({
            from: slab.from,
            to: slab.to,
            amount: slab.amount!,
          }));
      }

      if (data.housingAllowanceExemptionRules) {
        requestData.housingAllowanceExemptionRules = data.housingAllowanceExemptionRules;
      }

      if (data.travelAllowanceExemptionRules) {
        requestData.travelAllowanceExemptionRules = data.travelAllowanceExemptionRules;
      }

      if (data.standardDeduction !== undefined) {
        requestData.standardDeduction = data.standardDeduction;
      }

      if (data.taxExemptions && Object.keys(data.taxExemptions).length > 0) {
        requestData.taxExemptions = data.taxExemptions;
      }

      const response = await payrollApi.createTaxConfiguration(requestData);
      addToast({
        title: "Success",
        description: "Tax configuration created successfully",
        variant: "success",
      });
      router.push(`/dashboard/payroll/tax-configuration/${response.response.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to create tax configuration",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderSectionHeader = (title: string, sectionKey: string, enabled: boolean, onToggle: () => void) => {
    const isExpanded = expandedSections.has(sectionKey);
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => toggleSection(sectionKey)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
          <CardTitle>{title}</CardTitle>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={onToggle}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable</span>
        </label>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" onClick={() => router.push("/dashboard/payroll/tax-configurations")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Tax Configuration</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Configure tax settings for a company and country</p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Autocomplete
                    label="Company"
                    placeholder="Search for a company..."
                    options={companyOptions}
                    onSelect={handleCompanySelect}
                    onSearch={handleCompanySearch}
                    value={companyId}
                    isLoading={isSearchingCompanies}
                    required
                    error={errors.companyId?.message}
                    emptyMessage="No companies found. Try a different search term."
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <Select
                    id="country"
                    {...register("country")}
                    className={errors.country ? "border-red-500" : ""}
                  >
                    <option value="">Select country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </Select>
                  {errors.country && (
                    <p className="text-sm text-red-500 mt-1">{errors.country.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State/Province
                  </label>
                  <Input
                    id="state"
                    placeholder="e.g., Maharashtra"
                    {...register("state")}
                  />
                </div>

                <div>
                  <label htmlFor="financialYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Financial Year <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="financialYear"
                    placeholder="e.g., 2024-2025"
                    {...register("financialYear")}
                    className={errors.financialYear ? "border-red-500" : ""}
                  />
                  {errors.financialYear && (
                    <p className="text-sm text-red-500 mt-1">{errors.financialYear.message}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Format: YYYY-YYYY (e.g., 2024-2025)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Income Tax */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              {renderSectionHeader(
                "Income Tax",
                "incomeTax",
                incomeTaxEnabled || false,
                () => setValue("incomeTaxEnabled", !incomeTaxEnabled, { shouldValidate: true })
              )}
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("incomeTax") && (
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Tax Slabs
                        </label>
                        <Button
                          type="button"
                          onClick={addIncomeTaxSlab}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Slab
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {incomeTaxSlabs.map((slab, index) => (
                          <div key={slab.id} className="grid grid-cols-4 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
                              <Input
                                type="number"
                                {...register(`incomeTaxSlabs.${index}.from`, { valueAsNumber: true })}
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
                              <Input
                                type="number"
                                {...register(`incomeTaxSlabs.${index}.to`, {
                                  valueAsNumber: true,
                                  setValueAs: (v) => v === "" || v === null ? null : Number(v),
                                })}
                                placeholder="null for highest"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Rate (%)</label>
                              <Input
                                type="number"
                                step="0.01"
                                {...register(`incomeTaxSlabs.${index}.rate`, { valueAsNumber: true })}
                                placeholder="0"
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeIncomeTaxSlab(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Social Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              {renderSectionHeader(
                "Social Security (EPF/ESI)",
                "socialSecurity",
                socialSecurityEnabled || false,
                () => setValue("socialSecurityEnabled", !socialSecurityEnabled, { shouldValidate: true })
              )}
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("socialSecurity") && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Employer Rate (%)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="12.0"
                        {...register("socialSecurityEmployerRate", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Employee Rate (%)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="12.0"
                        {...register("socialSecurityEmployeeRate", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Salary
                      </label>
                      <Input
                        type="number"
                        placeholder="15000"
                        {...register("socialSecurityMaxSalary", { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Health Insurance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              {renderSectionHeader(
                "Health Insurance (ESI)",
                "healthInsurance",
                healthInsuranceEnabled || false,
                () => setValue("healthInsuranceEnabled", !healthInsuranceEnabled, { shouldValidate: true })
              )}
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("healthInsurance") && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Employer Rate (%)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="3.25"
                        {...register("healthInsuranceEmployerRate", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Employee Rate (%)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.75"
                        {...register("healthInsuranceEmployeeRate", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Salary
                      </label>
                      <Input
                        type="number"
                        placeholder="21000"
                        {...register("healthInsuranceMaxSalary", { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Professional Tax */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              {renderSectionHeader(
                "Professional Tax",
                "professionalTax",
                professionalTaxEnabled || false,
                () => setValue("professionalTaxEnabled", !professionalTaxEnabled, { shouldValidate: true })
              )}
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("professionalTax") && (
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Tax Slabs
                        </label>
                        <Button
                          type="button"
                          onClick={addProfessionalTaxSlab}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Slab
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {professionalTaxSlabs.map((slab, index) => (
                          <div key={slab.id} className="grid grid-cols-4 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
                              <Input
                                type="number"
                                {...register(`professionalTaxSlabs.${index}.from`, { valueAsNumber: true })}
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
                              <Input
                                type="number"
                                {...register(`professionalTaxSlabs.${index}.to`, {
                                  valueAsNumber: true,
                                  setValueAs: (v) => v === "" || v === null ? null : Number(v),
                                })}
                                placeholder="null for highest"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</label>
                              <Input
                                type="number"
                                {...register(`professionalTaxSlabs.${index}.amount`, { valueAsNumber: true })}
                                placeholder="0"
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeProfessionalTaxSlab(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Housing Allowance Exemption Rules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSection("housingAllowance")}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    {expandedSections.has("housingAllowance") ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  <CardTitle>Housing Allowance Exemption Rules</CardTitle>
                </div>
              </div>
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("housingAllowance") && (
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Exemption Type <span className="text-red-500">*</span>
                      </label>
                      <Select
                        {...register("housingAllowanceExemptionRules.type")}
                        className={errors.housingAllowanceExemptionRules?.type ? "border-red-500" : ""}
                      >
                        <option value="percentage_of_basic">Percentage of Basic</option>
                        <option value="fixed_amount">Fixed Amount</option>
                        <option value="actual_rent">Actual Rent</option>
                      </Select>
                      {errors.housingAllowanceExemptionRules?.type && (
                        <p className="text-sm text-red-500 mt-1">{errors.housingAllowanceExemptionRules.type.message}</p>
                      )}
                    </div>

                    {housingAllowanceType === "percentage_of_basic" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Max Percentage (%)
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="50"
                            {...register("housingAllowanceExemptionRules.maxPercentage", { valueAsNumber: true })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Min Rent Percentage (%)
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="10"
                            {...register("housingAllowanceExemptionRules.minRentPercentage", { valueAsNumber: true })}
                          />
                        </div>
                      </>
                    )}

                    {housingAllowanceType === "fixed_amount" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Fixed Amount
                        </label>
                        <Input
                          type="number"
                          placeholder="50000"
                          {...register("housingAllowanceExemptionRules.amount", { valueAsNumber: true })}
                        />
                      </div>
                    )}

                    {housingAllowanceType === "actual_rent" && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Actual rent paid will be used for exemption calculation.
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Travel Allowance Exemption Rules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSection("travelAllowance")}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    {expandedSections.has("travelAllowance") ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  <CardTitle>Travel Allowance Exemption Rules</CardTitle>
                </div>
              </div>
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("travelAllowance") && (
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Exemption Type <span className="text-red-500">*</span>
                      </label>
                      <Select
                        {...register("travelAllowanceExemptionRules.type")}
                        className={errors.travelAllowanceExemptionRules?.type ? "border-red-500" : ""}
                      >
                        <option value="actual_expense">Actual Expense</option>
                        <option value="fixed_amount">Fixed Amount</option>
                        <option value="percentage_of_basic">Percentage of Basic</option>
                      </Select>
                      {errors.travelAllowanceExemptionRules?.type && (
                        <p className="text-sm text-red-500 mt-1">{errors.travelAllowanceExemptionRules.type.message}</p>
                      )}
                    </div>

                    {travelAllowanceType === "fixed_amount" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Fixed Amount
                        </label>
                        <Input
                          type="number"
                          placeholder="19200"
                          {...register("travelAllowanceExemptionRules.amount", { valueAsNumber: true })}
                        />
                      </div>
                    )}

                    {travelAllowanceType === "percentage_of_basic" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Percentage (%)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="10"
                          {...register("travelAllowanceExemptionRules.percentage", { valueAsNumber: true })}
                        />
                      </div>
                    )}

                    {travelAllowanceType === "actual_expense" && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Actual expense incurred will be used for exemption calculation.
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Exemptions and Deductions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSection("exemptions")}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    {expandedSections.has("exemptions") ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  <CardTitle>Exemptions & Deductions</CardTitle>
                </div>
              </div>
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("exemptions") && (
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Standard Deduction
                </label>
                <Input
                  type="number"
                  placeholder="50000"
                  {...register("standardDeduction", { valueAsNumber: true })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tax Exemptions (Section-wise)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">80C</label>
                    <Input
                      type="number"
                      placeholder="150000"
                      {...register("taxExemptions.section80C", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">80D</label>
                    <Input
                      type="number"
                      placeholder="25000"
                      {...register("taxExemptions.section80D", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">80G</label>
                    <Input
                      type="number"
                      placeholder="10000"
                      {...register("taxExemptions.section80G", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">24</label>
                    <Input
                      type="number"
                      placeholder="200000"
                      {...register("taxExemptions.section24", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-end gap-4"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/payroll/tax-configurations")}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Tax Configuration
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}

