"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Autocomplete, AutocompleteOption } from "@/components/ui/autocomplete";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { payrollApi, CreateTaxDeclarationRequest } from "@/lib/api/payroll";
import { companiesApi } from "@/lib/api/companies";
import { employeesApi } from "@/lib/api/employees";
import { Company, Employee } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "@/lib/hooks/use-debounce";

const taxDeclarationSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  companyId: z.string().min(1, "Company is required"),
  financialYear: z.string().min(1, "Financial year is required"),
  declarations: z.record(z.string(), z.record(z.string(), z.number())),
});

type TaxDeclarationFormData = z.infer<typeof taxDeclarationSchema>;

const commonTaxSections = {
  section80C: ["ppf", "elss", "insurance", "fixed_deposit", "nsc", "tax_saving_fd"],
  section80D: ["health_insurance_self", "health_insurance_parents"],
  section80G: ["donations"],
  section24: ["home_loan_interest"],
  section80E: ["education_loan_interest"],
  section80TTA: ["savings_account_interest"],
};

export default function NewTaxDeclarationPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<AutocompleteOption[]>([]);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState<AutocompleteOption[]>([]);
  const [isSearchingEmployees, setIsSearchingEmployees] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const debouncedCompanySearch = useDebounce(companySearchTerm, 300);
  const debouncedEmployeeSearch = useDebounce(employeeSearchTerm, 300);

  const currentYear = new Date().getFullYear();
  const financialYear = `${currentYear}-${currentYear + 1}`;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TaxDeclarationFormData>({
    resolver: zodResolver(taxDeclarationSchema),
    defaultValues: {
      financialYear,
      declarations: {},
    },
  });

  const companyId = watch("companyId");
  const employeeId = watch("employeeId");
  const declarations = watch("declarations") || {};

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

  // Search employees
  const searchEmployees = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2 || !companyId) {
      setEmployeeOptions([]);
      return;
    }
    setIsSearchingEmployees(true);
    try {
      const response = await employeesApi.searchEmployees({
        searchTerm,
        limit: 20,
        companyId,
      });
      const options: AutocompleteOption[] = response.response.map((employee: Employee) => ({
        id: employee.id,
        label: `${employee.firstName} ${employee.lastName}`,
        subtitle: `${employee.email} - ${employee.jobTitle}`,
      }));
      setEmployeeOptions(options);
    } catch {
      setEmployeeOptions([]);
    } finally {
      setIsSearchingEmployees(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (debouncedCompanySearch) {
      searchCompanies(debouncedCompanySearch);
    } else {
      setCompanyOptions([]);
    }
  }, [debouncedCompanySearch, searchCompanies]);

  useEffect(() => {
    if (debouncedEmployeeSearch && companyId) {
      searchEmployees(debouncedEmployeeSearch);
    } else {
      setEmployeeOptions([]);
    }
  }, [debouncedEmployeeSearch, companyId, searchEmployees]);

  useEffect(() => {
    if (employeeId && !companyId) {
      const fetchEmployeeCompany = async () => {
        try {
          const response = await employeesApi.getEmployee(employeeId);
          if (response.response?.companyId) {
            setValue("companyId", response.response.companyId, { shouldValidate: true });
            try {
              const companyResponse = await companiesApi.getCompany(response.response.companyId);
              const company = companyResponse.response;
              setCompanyOptions([{
                id: company.id,
                label: company.name,
                subtitle: `${company.code}${company.description ? ` - ${company.description}` : ""}`,
                imageUrl: company.profileImageUrl,
              }]);
              setCompanySearchTerm(company.name);
            } catch {}
          }
        } catch {}
      };
      fetchEmployeeCompany();
    }
  }, [employeeId, companyId, setValue]);

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

  const handleEmployeeSelect = (option: AutocompleteOption | null) => {
    if (option) {
      setValue("employeeId", option.id, { shouldValidate: true });
      setEmployeeSearchTerm(option.label);
    } else {
      setValue("employeeId", "", { shouldValidate: true });
      setEmployeeSearchTerm("");
    }
  };

  const handleEmployeeSearch = (searchTerm: string) => {
    setEmployeeSearchTerm(searchTerm);
  };

  const updateDeclaration = (section: string, item: string, value: number) => {
    const currentDeclarations = declarations || {};
    const sectionData = currentDeclarations[section] || {};
    sectionData[item] = value;
    setValue(`declarations.${section}`, sectionData, { shouldValidate: true });
  };

  const onSubmit = async (data: TaxDeclarationFormData) => {
    setIsSaving(true);
    try {
      // Clean up empty declarations
      const cleanedDeclarations: Record<string, Record<string, number>> = {};
      Object.entries(data.declarations).forEach(([section, items]) => {
        const cleanedItems: Record<string, number> = {};
        Object.entries(items).forEach(([item, value]) => {
          if (value && value > 0) {
            cleanedItems[item] = value;
          }
        });
        if (Object.keys(cleanedItems).length > 0) {
          cleanedDeclarations[section] = cleanedItems;
        }
      });

      const requestData: CreateTaxDeclarationRequest = {
        employeeId: data.employeeId,
        companyId: data.companyId,
        financialYear: data.financialYear,
        declarations: cleanedDeclarations,
      };

      await payrollApi.createOrUpdateTaxDeclaration(requestData);
      addToast({
        title: "Success",
        description: "Tax declaration created successfully",
        variant: "success",
      });
      router.push("/dashboard/payroll/tax-declarations");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to create tax declaration",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatLabel = (str: string): string => {
    return str.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" onClick={() => router.push("/dashboard/payroll/tax-declarations")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Tax Declaration</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create tax-saving declarations for an employee</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Tax Declaration Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  />
                </div>

                <div>
                  <Autocomplete
                    label="Employee"
                    placeholder={companyId ? "Search for an employee..." : "Select company first"}
                    options={employeeOptions}
                    onSelect={handleEmployeeSelect}
                    onSearch={handleEmployeeSearch}
                    value={employeeId}
                    isLoading={isSearchingEmployees}
                    required
                    error={errors.employeeId?.message}
                    disabled={!companyId}
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

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tax Savings Declarations</h3>
                <div className="space-y-6">
                  {Object.entries(commonTaxSections).map(([section, items]) => (
                    <div key={section} className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{formatLabel(section)}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map((item) => (
                          <div key={item}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {formatLabel(item)}
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0"
                              defaultValue={declarations[section]?.[item] || 0}
                              onChange={(e) => updateDeclaration(section, item, parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/payroll/tax-declarations")}
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
                      Create Tax Declaration
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

