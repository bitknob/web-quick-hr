"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Autocomplete, AutocompleteOption } from "@/components/ui/autocomplete";
import { ArrowLeft, Save, Calculator } from "lucide-react";
import { payrollApi, CreateLoanRequest } from "@/lib/api/payroll";
import { companiesApi } from "@/lib/api/companies";
import { employeesApi } from "@/lib/api/employees";
import { Company, Employee } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "@/lib/hooks/use-debounce";

const loanSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  companyId: z.string().min(1, "Company is required"),
  loanType: z.enum(["personal_loan", "advance_salary", "home_loan", "vehicle_loan", "education_loan", "medical_loan", "other"]),
  loanName: z.string().min(1, "Loan name is required"),
  principalAmount: z.number().min(0, "Principal amount must be positive"),
  interestRate: z.number().min(0).max(100, "Interest rate must be between 0 and 100"),
  tenureMonths: z.number().min(1, "Tenure must be at least 1 month"),
  startDate: z.string().min(1, "Start date is required"),
  deductionStartMonth: z.number().min(1).max(12),
  deductionStartYear: z.number().min(2020).max(2100),
});

type LoanFormData = z.infer<typeof loanSchema>;

const loanTypes = [
  { value: "personal_loan", label: "Personal Loan" },
  { value: "advance_salary", label: "Salary Advance" },
  { value: "home_loan", label: "Home Loan" },
  { value: "vehicle_loan", label: "Vehicle Loan" },
  { value: "education_loan", label: "Education Loan" },
  { value: "medical_loan", label: "Medical Loan" },
  { value: "other", label: "Other" },
];

export default function NewLoanPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<AutocompleteOption[]>([]);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState<AutocompleteOption[]>([]);
  const [isSearchingEmployees, setIsSearchingEmployees] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [emiPreview, setEmiPreview] = useState<{ emiAmount: number; totalAmount: number; totalInterest: number } | null>(null);
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
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      deductionStartMonth: currentMonth,
      deductionStartYear: currentYear,
      startDate: new Date().toISOString().split("T")[0],
    },
  });

  const companyId = watch("companyId");
  const employeeId = watch("employeeId");
  const principalAmount = watch("principalAmount");
  const interestRate = watch("interestRate");
  const tenureMonths = watch("tenureMonths");

  // Calculate EMI preview
  useEffect(() => {
    if (principalAmount && interestRate && tenureMonths && principalAmount > 0 && tenureMonths > 0) {
      const calculateEMI = async () => {
        try {
          const response = await payrollApi.calculateEMI({
            principalAmount,
            interestRate,
            tenureMonths,
          });
          setEmiPreview(response.response);
        } catch {
          setEmiPreview(null);
        }
      };
      calculateEMI();
    } else {
      setEmiPreview(null);
    }
  }, [principalAmount, interestRate, tenureMonths]);

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

  const onSubmit = async (data: LoanFormData) => {
    setIsSaving(true);
    try {
      const requestData: CreateLoanRequest = {
        employeeId: data.employeeId,
        companyId: data.companyId,
        loanType: data.loanType,
        loanName: data.loanName,
        principalAmount: data.principalAmount,
        interestRate: data.interestRate,
        tenureMonths: data.tenureMonths,
        startDate: data.startDate,
        deductionStartMonth: data.deductionStartMonth,
        deductionStartYear: data.deductionStartYear,
      };

      await payrollApi.createLoan(requestData);
      addToast({
        title: "Success",
        description: "Loan created successfully",
        variant: "success",
      });
      router.push("/dashboard/payroll/loans");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to create loan",
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
        <Button variant="ghost" onClick={() => router.push("/dashboard/payroll/loans")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Loan</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create a new employee loan record</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Loan Information</CardTitle>
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
                  <label htmlFor="loanType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Loan Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    id="loanType"
                    {...register("loanType")}
                    className={errors.loanType ? "border-red-500" : ""}
                  >
                    <option value="">Select type</option>
                    {loanTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                  {errors.loanType && (
                    <p className="text-sm text-red-500 mt-1">{errors.loanType.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="loanName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Loan Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="loanName"
                    placeholder="e.g., Personal Loan - Home Renovation"
                    {...register("loanName")}
                    className={errors.loanName ? "border-red-500" : ""}
                  />
                  {errors.loanName && (
                    <p className="text-sm text-red-500 mt-1">{errors.loanName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="principalAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Principal Amount <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="principalAmount"
                    type="number"
                    step="0.01"
                    placeholder="500000"
                    {...register("principalAmount", { valueAsNumber: true })}
                    className={errors.principalAmount ? "border-red-500" : ""}
                  />
                  {errors.principalAmount && (
                    <p className="text-sm text-red-500 mt-1">{errors.principalAmount.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Interest Rate (% p.a.) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    placeholder="12.5"
                    {...register("interestRate", { valueAsNumber: true })}
                    className={errors.interestRate ? "border-red-500" : ""}
                  />
                  {errors.interestRate && (
                    <p className="text-sm text-red-500 mt-1">{errors.interestRate.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="tenureMonths" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tenure (Months) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="tenureMonths"
                    type="number"
                    min={1}
                    placeholder="36"
                    {...register("tenureMonths", { valueAsNumber: true })}
                    className={errors.tenureMonths ? "border-red-500" : ""}
                  />
                  {errors.tenureMonths && (
                    <p className="text-sm text-red-500 mt-1">{errors.tenureMonths.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register("startDate")}
                    className={errors.startDate ? "border-red-500" : ""}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-500 mt-1">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="deductionStartMonth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deduction Start Month <span className="text-red-500">*</span>
                  </label>
                  <Select
                    id="deductionStartMonth"
                    {...register("deductionStartMonth", { valueAsNumber: true })}
                    className={errors.deductionStartMonth ? "border-red-500" : ""}
                    value={watch("deductionStartMonth")?.toString() || ""}
                    onChange={(e) => setValue("deductionStartMonth", parseInt(e.target.value), { shouldValidate: true })}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {new Date(2024, month - 1).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </Select>
                  {errors.deductionStartMonth && (
                    <p className="text-sm text-red-500 mt-1">{errors.deductionStartMonth.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="deductionStartYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deduction Start Year <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="deductionStartYear"
                    type="number"
                    min={2020}
                    max={2100}
                    placeholder={currentYear.toString()}
                    {...register("deductionStartYear", { valueAsNumber: true })}
                    className={errors.deductionStartYear ? "border-red-500" : ""}
                  />
                  {errors.deductionStartYear && (
                    <p className="text-sm text-red-500 mt-1">{errors.deductionStartYear.message}</p>
                  )}
                </div>
              </div>

              {emiPreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">EMI Preview</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">EMI Amount:</span>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        ₹{emiPreview.emiAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Total Amount:</span>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        ₹{emiPreview.totalAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Total Interest:</span>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        ₹{emiPreview.totalInterest.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/payroll/loans")}
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
                      Create Loan
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

