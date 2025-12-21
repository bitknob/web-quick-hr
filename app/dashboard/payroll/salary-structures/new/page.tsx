"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Autocomplete, AutocompleteOption } from "@/components/ui/autocomplete";
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from "lucide-react";
import { payrollApi, CreateSalaryStructureRequest } from "@/lib/api/payroll";
import { companiesApi } from "@/lib/api/companies";
import { Company, SalaryComponent } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "@/lib/hooks/use-debounce";

const componentSchema = z.object({
  componentName: z.string().min(1, "Component name is required"),
  componentType: z.enum(["earning", "deduction"]),
  componentCategory: z.string().min(1, "Category is required"),
  isPercentage: z.boolean(),
  value: z.number().min(0, "Value must be positive"),
  percentageOf: z.string().optional(),
  isTaxable: z.boolean(),
  isStatutory: z.boolean(),
  priority: z.number().min(1, "Priority must be at least 1"),
});

const salaryStructureSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  components: z.array(componentSchema).min(1, "At least one component is required"),
});

type SalaryStructureFormData = z.infer<typeof salaryStructureSchema>;

const commonCategories = {
  earning: ["basic", "hra", "special_allowance", "transport_allowance", "medical_allowance", "bonus"],
  deduction: ["income_tax", "professional_tax", "provident_fund", "health_insurance", "loan", "advance"],
};

export default function NewSalaryStructurePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<AutocompleteOption[]>([]);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(companySearchTerm, 300);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SalaryStructureFormData>({
    resolver: zodResolver(salaryStructureSchema),
    defaultValues: {
      components: [
        {
          componentName: "Basic Salary",
          componentType: "earning",
          componentCategory: "basic",
          isPercentage: true,
          value: 40,
          percentageOf: "ctc",
          isTaxable: true,
          isStatutory: false,
          priority: 1,
        },
      ],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "components",
  });

  const companyId = watch("companyId");
  const components = watch("components");

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

  const addComponent = () => {
    const nextPriority = components.length + 1;
    append({
      componentName: "",
      componentType: "earning",
      componentCategory: "",
      isPercentage: true,
      value: 0,
      percentageOf: "ctc",
      isTaxable: true,
      isStatutory: false,
      priority: nextPriority,
    });
  };

  const removeComponent = (index: number) => {
    remove(index);
    // Recalculate priorities
    components.forEach((_, idx) => {
      if (idx !== index && idx > index) {
        setValue(`components.${idx}.priority`, idx, { shouldValidate: true });
      }
    });
  };

  const onSubmit = async (data: SalaryStructureFormData) => {
    setIsSaving(true);
    try {
      // Ensure priorities are sequential
      const componentsWithPriority = data.components.map((comp, index) => ({
        ...comp,
        priority: index + 1,
      }));

      const requestData: CreateSalaryStructureRequest = {
        companyId: data.companyId,
        name: data.name,
        description: data.description,
        components: componentsWithPriority,
      };

      const response = await payrollApi.createSalaryStructure(requestData);
      addToast({
        title: "Success",
        description: "Salary structure created successfully",
        variant: "success",
      });
      router.push(`/dashboard/payroll/salary-structures/${response.response.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to create salary structure",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" onClick={() => router.push("/dashboard/payroll/salary-structures")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Salary Structure</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Define a new salary structure template with components</p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  {companyId && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Selected Company ID: <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{companyId}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Structure Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    placeholder="e.g., Standard Salary Structure"
                    {...register("name")}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <Input
                  id="description"
                  placeholder="Brief description of this salary structure"
                  {...register("description")}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Optional description to help identify this structure
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Salary Components</CardTitle>
                <Button type="button" onClick={addComponent} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Component
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {errors.components && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.components.message || "Please add at least one component"}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <AnimatePresence>
                  {fields.map((field, index) => {
                    const componentType = watch(`components.${index}.componentType`);
                    const isPercentage = watch(`components.${index}.isPercentage`);
                    
                    return (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900/50"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-5 w-5 text-gray-400" />
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              Component {index + 1}
                            </h3>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeComponent(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Component Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                              placeholder="e.g., Basic Salary"
                              {...register(`components.${index}.componentName`)}
                              className={errors.components?.[index]?.componentName ? "border-red-500" : ""}
                            />
                            {errors.components?.[index]?.componentName && (
                              <p className="text-sm text-red-500 mt-1">
                                {errors.components[index]?.componentName?.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Type <span className="text-red-500">*</span>
                            </label>
                            <Select
                              {...register(`components.${index}.componentType`)}
                              onChange={(e) => {
                                setValue(`components.${index}.componentType`, e.target.value as "earning" | "deduction", { shouldValidate: true });
                                setValue(`components.${index}.componentCategory`, "", { shouldValidate: true });
                              }}
                            >
                              <option value="earning">Earning</option>
                              <option value="deduction">Deduction</option>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Category <span className="text-red-500">*</span>
                            </label>
                            <Select
                              {...register(`components.${index}.componentCategory`)}
                              className={errors.components?.[index]?.componentCategory ? "border-red-500" : ""}
                            >
                              <option value="">Select category</option>
                              {commonCategories[componentType || "earning"].map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                                </option>
                              ))}
                            </Select>
                            {errors.components?.[index]?.componentCategory && (
                              <p className="text-sm text-red-500 mt-1">
                                {errors.components[index]?.componentCategory?.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Calculation Type
                            </label>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={isPercentage}
                                  onChange={() => setValue(`components.${index}.isPercentage`, true, { shouldValidate: true })}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">Percentage</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={!isPercentage}
                                  onChange={() => setValue(`components.${index}.isPercentage`, false, { shouldValidate: true })}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">Fixed Amount</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {isPercentage ? "Percentage" : "Amount"} <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              step={isPercentage ? "0.01" : "1"}
                              placeholder={isPercentage ? "40" : "10000"}
                              {...register(`components.${index}.value`, { valueAsNumber: true })}
                              className={errors.components?.[index]?.value ? "border-red-500" : ""}
                            />
                            {errors.components?.[index]?.value && (
                              <p className="text-sm text-red-500 mt-1">
                                {errors.components[index]?.value?.message}
                              </p>
                            )}
                          </div>

                          {isPercentage && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Percentage Of
                              </label>
                              <Select {...register(`components.${index}.percentageOf`)}>
                                <option value="ctc">CTC</option>
                                <option value="basic">Basic Salary</option>
                                <option value="gross">Gross Salary</option>
                              </Select>
                            </div>
                          )}

                          <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                {...register(`components.${index}.isTaxable`)}
                                className="w-4 h-4 rounded"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Taxable</span>
                            </label>
                          </div>

                          <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                {...register(`components.${index}.isStatutory`)}
                                className="w-4 h-4 rounded"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Statutory</span>
                            </label>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Priority <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              min={1}
                              value={index + 1}
                              readOnly
                              className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Lower number = higher priority
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {fields.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No components added yet</p>
                  <Button type="button" onClick={addComponent} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Component
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-end gap-4"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/payroll/salary-structures")}
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
                Create Salary Structure
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}

