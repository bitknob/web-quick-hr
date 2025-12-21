"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Autocomplete, AutocompleteOption } from "@/components/ui/autocomplete";
import { ArrowLeft, Save } from "lucide-react";
import { payrollApi, CreateVariablePayRequest } from "@/lib/api/payroll";
import { companiesApi } from "@/lib/api/companies";
import { employeesApi } from "@/lib/api/employees";
import { Company, Employee } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "@/lib/hooks/use-debounce";

const variablePaySchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  companyId: z.string().min(1, "Company is required"),
  variablePayType: z.enum(["bonus", "incentive", "commission", "overtime", "shift_allowance", "performance_bonus", "retention_bonus", "other"]),
  description: z.string().optional(),
  amount: z.number().min(0, "Amount must be positive"),
  calculationBasis: z.string().optional(),
  applicableMonth: z.number().min(1).max(12),
  applicableYear: z.number().min(2020).max(2100),
  isTaxable: z.boolean(),
  isRecurring: z.boolean(),
});

type VariablePayFormData = z.infer<typeof variablePaySchema>;

const variablePayTypes = [
  { value: "bonus", label: "Bonus" },
  { value: "incentive", label: "Incentive" },
  { value: "commission", label: "Commission" },
  { value: "overtime", label: "Overtime" },
  { value: "shift_allowance", label: "Shift Allowance" },
  { value: "performance_bonus", label: "Performance Bonus" },
  { value: "retention_bonus", label: "Retention Bonus" },
  { value: "other", label: "Other" },
];

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function NewVariablePayPage() {
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
  const currentMonth = new Date().getMonth() + 1;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VariablePayFormData>({
    resolver: zodResolver(variablePaySchema),
    defaultValues: {
      applicableMonth: currentMonth,
      applicableYear: currentYear,
      isTaxable: true,
      isRecurring: false,
    },
  });

  const companyId = watch("companyId");
  const employeeId = watch("employeeId");
  const applicableMonth = watch("applicableMonth");
  const applicableYear = watch("applicableYear");

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

  // Auto-populate company when employee is selected
  useEffect(() => {
    if (employeeId && !companyId) {
      // Try to get employee's company
      const fetchEmployeeCompany = async () => {
        try {
          const response = await employeesApi.getEmployee(employeeId);
          if (response.response?.companyId) {
            setValue("companyId", response.response.companyId, { shouldValidate: true });
            // Fetch company details for autocomplete display
            try {
              const companyResponse = await companiesApi.getCompany(response.response.companyId);
              const company = companyResponse.response;
              setCompanyOptions([
                {
                  id: company.id,
                  label: company.name,
                  subtitle: `${company.code}${company.description ? ` - ${company.description}` : ""}`,
                  imageUrl: company.profileImageUrl,
                },
              ]);
              setCompanySearchTerm(company.name);
            } catch {
              // Company fetch failed
            }
          }
        } catch {
          // Employee fetch failed
        }
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

  const onSubmit = async (data: VariablePayFormData) => {
    setIsSaving(true);
    try {
      const requestData: CreateVariablePayRequest = {
        employeeId: data.employeeId,
        companyId: data.companyId,
        variablePayType: data.variablePayType,
        description: data.description,
        amount: data.amount,
        calculationBasis: data.calculationBasis,
        applicableMonth: data.applicableMonth,
        applicableYear: data.applicableYear,
        isTaxable: data.isTaxable,
        isRecurring: data.isRecurring,
      };

      await payrollApi.createVariablePay(requestData);
      addToast({
        title: "Success",
        description: "Variable pay created successfully",
        variant: "success",
      });
      router.push("/dashboard/payroll/variable-pay");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to create variable pay",
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
        <Button variant="ghost" onClick={() => router.push("/dashboard/payroll/variable-pay")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Variable Pay</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Add variable pay record for bonuses, incentives, and other variable compensation</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Variable Pay Information</CardTitle>
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
                    emptyMessage={companyId ? "No employees found. Try a different search term." : "Please select a company first"}
                    disabled={!companyId}
                  />
                  {employeeId && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Selected Employee ID: <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{employeeId}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="variablePayType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Variable Pay Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    id="variablePayType"
                    {...register("variablePayType")}
                    className={errors.variablePayType ? "border-red-500" : ""}
                  >
                    <option value="">Select type</option>
                    {variablePayTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                  {errors.variablePayType && (
                    <p className="text-sm text-red-500 mt-1">{errors.variablePayType.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="50000"
                    {...register("amount", { valueAsNumber: true })}
                    className={errors.amount ? "border-red-500" : ""}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter the variable pay amount in the default currency
                  </p>
                </div>

                <div>
                  <label htmlFor="applicableMonth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Applicable Month <span className="text-red-500">*</span>
                  </label>
                  <Select
                    id="applicableMonth"
                    {...register("applicableMonth", { valueAsNumber: true })}
                    className={errors.applicableMonth ? "border-red-500" : ""}
                    value={applicableMonth?.toString() || ""}
                    onChange={(e) => setValue("applicableMonth", parseInt(e.target.value), { shouldValidate: true })}
                  >
                    <option value="">Select month</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </Select>
                  {errors.applicableMonth && (
                    <p className="text-sm text-red-500 mt-1">{errors.applicableMonth.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="applicableYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Applicable Year <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="applicableYear"
                    type="number"
                    min={2020}
                    max={2100}
                    placeholder={currentYear.toString()}
                    {...register("applicableYear", { valueAsNumber: true })}
                    className={errors.applicableYear ? "border-red-500" : ""}
                  />
                  {errors.applicableYear && (
                    <p className="text-sm text-red-500 mt-1">{errors.applicableYear.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="calculationBasis" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Calculation Basis
                  </label>
                  <Input
                    id="calculationBasis"
                    placeholder="e.g., performance_rating, target_achievement"
                    {...register("calculationBasis")}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Optional: Basis for calculating this variable pay
                  </p>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <Input
                    id="description"
                    placeholder="e.g., Annual Performance Bonus"
                    {...register("description")}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Optional description for this variable pay
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("isTaxable")}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Taxable</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Check if this variable pay is subject to tax
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("isRecurring")}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recurring</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Check if this variable pay should be applied monthly
                  </p>
                </div>
              </div>

              {applicableMonth && applicableYear && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Summary</h3>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      <span className="font-medium">Period:</span> {months.find((m) => m.value === applicableMonth)?.label} {applicableYear}
                    </p>
                    <p>
                      <span className="font-medium">Type:</span> {variablePayTypes.find((t) => t.value === watch("variablePayType"))?.label || "Not selected"}
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/payroll/variable-pay")}
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
                      Create Variable Pay
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

