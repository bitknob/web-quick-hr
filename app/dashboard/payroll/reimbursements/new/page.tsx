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
import { payrollApi, CreateReimbursementRequest } from "@/lib/api/payroll";
import { companiesApi } from "@/lib/api/companies";
import { employeesApi } from "@/lib/api/employees";
import { Company, Employee } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "@/lib/hooks/use-debounce";

const reimbursementSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  companyId: z.string().min(1, "Company is required"),
  reimbursementType: z.enum(["travel", "medical", "meal", "telephone", "internet", "fuel", "conveyance", "other"]),
  description: z.string().optional(),
  claimAmount: z.number().min(0, "Claim amount must be positive"),
  claimDate: z.string().min(1, "Claim date is required"),
  applicableMonth: z.number().min(1).max(12),
  applicableYear: z.number().min(2020).max(2100),
  isTaxable: z.boolean(),
  taxExemptionLimit: z.number().optional(),
});

type ReimbursementFormData = z.infer<typeof reimbursementSchema>;

const reimbursementTypes = [
  { value: "travel", label: "Travel" },
  { value: "medical", label: "Medical" },
  { value: "meal", label: "Meal" },
  { value: "telephone", label: "Telephone" },
  { value: "internet", label: "Internet" },
  { value: "fuel", label: "Fuel" },
  { value: "conveyance", label: "Conveyance" },
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

export default function NewReimbursementPage() {
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
  } = useForm<ReimbursementFormData>({
    resolver: zodResolver(reimbursementSchema),
    defaultValues: {
      applicableMonth: currentMonth,
      applicableYear: currentYear,
      claimDate: new Date().toISOString().split("T")[0],
      isTaxable: false,
    },
  });

  const companyId = watch("companyId");
  const employeeId = watch("employeeId");
  const isTaxable = watch("isTaxable");

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

  const onSubmit = async (data: ReimbursementFormData) => {
    setIsSaving(true);
    try {
      const requestData: CreateReimbursementRequest = {
        employeeId: data.employeeId,
        companyId: data.companyId,
        reimbursementType: data.reimbursementType,
        description: data.description,
        claimAmount: data.claimAmount,
        claimDate: data.claimDate,
        applicableMonth: data.applicableMonth,
        applicableYear: data.applicableYear,
        isTaxable: data.isTaxable,
        taxExemptionLimit: data.taxExemptionLimit,
      };

      await payrollApi.createReimbursement(requestData);
      addToast({
        title: "Success",
        description: "Reimbursement created successfully",
        variant: "success",
      });
      router.push("/dashboard/payroll/reimbursements");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to create reimbursement",
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
        <Button variant="ghost" onClick={() => router.push("/dashboard/payroll/reimbursements")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Reimbursement</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create a new reimbursement claim for employee expenses</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Reimbursement Information</CardTitle>
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
                  <label htmlFor="reimbursementType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reimbursement Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    id="reimbursementType"
                    {...register("reimbursementType")}
                    className={errors.reimbursementType ? "border-red-500" : ""}
                  >
                    <option value="">Select type</option>
                    {reimbursementTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                  {errors.reimbursementType && (
                    <p className="text-sm text-red-500 mt-1">{errors.reimbursementType.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="claimAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Claim Amount <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="claimAmount"
                    type="number"
                    step="0.01"
                    placeholder="15000"
                    {...register("claimAmount", { valueAsNumber: true })}
                    className={errors.claimAmount ? "border-red-500" : ""}
                  />
                  {errors.claimAmount && (
                    <p className="text-sm text-red-500 mt-1">{errors.claimAmount.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="claimDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Claim Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="claimDate"
                    type="date"
                    {...register("claimDate")}
                    className={errors.claimDate ? "border-red-500" : ""}
                  />
                  {errors.claimDate && (
                    <p className="text-sm text-red-500 mt-1">{errors.claimDate.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="applicableMonth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Applicable Month <span className="text-red-500">*</span>
                  </label>
                  <Select
                    id="applicableMonth"
                    {...register("applicableMonth", { valueAsNumber: true })}
                    className={errors.applicableMonth ? "border-red-500" : ""}
                    value={watch("applicableMonth")?.toString() || ""}
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

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <Input
                    id="description"
                    placeholder="e.g., Client visit - Mumbai"
                    {...register("description")}
                  />
                </div>

                {isTaxable && (
                  <div>
                    <label htmlFor="taxExemptionLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tax Exemption Limit
                    </label>
                    <Input
                      id="taxExemptionLimit"
                      type="number"
                      step="0.01"
                      placeholder="15000"
                      {...register("taxExemptionLimit", { valueAsNumber: true })}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Maximum amount exempt from tax
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("isTaxable")}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Taxable</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Check if this reimbursement is subject to tax
                </p>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/payroll/reimbursements")}
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
                      Create Reimbursement
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

