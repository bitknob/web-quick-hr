"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Autocomplete, AutocompleteOption } from "@/components/ui/autocomplete";
import { ArrowLeft, Save, Calendar } from "lucide-react";
import { payrollApi } from "@/lib/api/payroll";
import { companiesApi } from "@/lib/api/companies";
import { Company } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useAuthStore } from "@/lib/store/auth-store";

const newPayrollRunSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  payrollMonth: z.number().min(1, "Month is required").max(12, "Invalid month"),
  payrollYear: z.number().min(2020, "Year must be 2020 or later").max(2100, "Invalid year"),
});

type NewPayrollRunFormData = z.infer<typeof newPayrollRunSchema>;

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

export default function NewPayrollRunPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { user, checkAuth } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<AutocompleteOption[]>([]);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(companySearchTerm, 300);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<NewPayrollRunFormData>({
    resolver: zodResolver(newPayrollRunSchema),
    defaultValues: {
      payrollMonth: currentMonth,
      payrollYear: currentYear,
    },
  });

  const companyId = watch("companyId");
  const payrollMonth = watch("payrollMonth");
  const payrollYear = watch("payrollYear");

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

  // Try to pre-populate company from current user's employee data
  useEffect(() => {
    const fetchCurrentEmployee = async () => {
      try {
        // Try to get current employee's company
        // Note: You may need to adjust this based on your employee API
        // For now, we'll skip this and let user select manually
      } catch {
        // Silently fail - user can select company manually
      }
    };
    fetchCurrentEmployee();
  }, []);

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

  const onSubmit = async (data: NewPayrollRunFormData) => {
    let currentUser = user;
    
    // If user is not available or doesn't have an id, try to fetch it
    if (!currentUser?.id) {
      try {
        await checkAuth();
        currentUser = useAuthStore.getState().user;
      } catch {
        // Failed to fetch user - will show error below
      }
    }

    if (!currentUser?.id) {
      addToast({
        title: "Error",
        description: "User information not available. Please log in again.",
        variant: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await payrollApi.createPayrollRun({
        companyId: data.companyId,
        payrollMonth: data.payrollMonth,
        payrollYear: data.payrollYear,
        processedBy: currentUser.id,
      });
      addToast({
        title: "Success",
        description: "Payroll run created successfully",
        variant: "success",
      });
      router.push(`/dashboard/payroll/runs/${response.response.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to create payroll run",
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
        <Button variant="ghost" onClick={() => router.push("/dashboard/payroll/runs")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Payroll Run</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create a new payroll run for processing employee salaries</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Payroll Run Information</CardTitle>
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
                  <label htmlFor="payrollYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payroll Year <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="payrollYear"
                    type="number"
                    min={2020}
                    max={2100}
                    placeholder={currentYear.toString()}
                    {...register("payrollYear", { valueAsNumber: true })}
                    className={errors.payrollYear ? "border-red-500" : ""}
                  />
                  {errors.payrollYear && (
                    <p className="text-sm text-red-500 mt-1">{errors.payrollYear.message}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter the financial year for this payroll run
                  </p>
                </div>

                <div>
                  <label htmlFor="payrollMonth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payroll Month <span className="text-red-500">*</span>
                  </label>
                  <Select
                    id="payrollMonth"
                    {...register("payrollMonth", { valueAsNumber: true })}
                    className={errors.payrollMonth ? "border-red-500" : ""}
                    value={payrollMonth?.toString() || ""}
                    onChange={(e) => setValue("payrollMonth", parseInt(e.target.value), { shouldValidate: true })}
                  >
                    <option value="">Select a month</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </Select>
                  {errors.payrollMonth && (
                    <p className="text-sm text-red-500 mt-1">{errors.payrollMonth.message}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Select the month for which payroll will be processed
                  </p>
                </div>
              </div>

              {payrollMonth && payrollYear && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Payroll Run Summary</h3>
                  </div>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      <span className="font-medium">Period:</span> {months.find((m) => m.value === payrollMonth)?.label} {payrollYear}
                    </p>
                    {(user?.email || user?.id) && (
                      <p>
                        <span className="font-medium">Processed By:</span> {user?.email || "Current User"}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      After creating the payroll run, you can process it to generate payslips for all employees in the selected company.
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/payroll/runs")}
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
                      Create Payroll Run
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

