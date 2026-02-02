"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Autocomplete, AutocompleteOption } from "@/components/ui/autocomplete";
import { ArrowLeft, Save, Copy, CheckCircle, AlertTriangle } from "lucide-react";
import { employeesApi } from "@/lib/api/employees";
import { companiesApi } from "@/lib/api/companies";
import { departmentsApi } from "@/lib/api/departments";
import { Company, Department } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { getErrorMessage } from "@/lib/utils";

const newEmployeeSchema = z.object({
  userEmail: z.string().email("Invalid email address").min(1, "User email is required"),
  companyId: z.string().min(1, "Company ID is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  userCompEmail: z.string().email("Invalid email address").min(1, "Company email is required"),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().optional(),
  jobTitle: z.string().min(1, "Job title is required"),
  department: z.string().min(1, "Department is required"),
  managerId: z.string().optional(),
  hireDate: z.string().min(1, "Hire date is required"),
  salary: z.number().min(0, "Salary must be a positive number"),
});

type NewEmployeeFormData = z.infer<typeof newEmployeeSchema>;

export default function NewEmployeePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<AutocompleteOption[]>([]);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(companySearchTerm, 300);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [showCrossCompanyDialog, setShowCrossCompanyDialog] = useState(false);
  const [pendingCompanyId, setPendingCompanyId] = useState<string | null>(null);
  const [requiresApproval, setRequiresApproval] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<NewEmployeeFormData>({
    resolver: zodResolver(newEmployeeSchema),
    defaultValues: {
      hireDate: new Date().toISOString().split("T")[0],
    },
  });

  const companyId = watch("companyId");

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
      // Silently fail - user can still type company ID manually
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

  useEffect(() => {
    const fetchCurrentEmployee = async () => {
      try {
        const response = await employeesApi.getCurrentEmployee();
        // Type guard: check if response is an Employee (has companyId) vs SuperAdminEmployeeResponse
        if (response.response && 'companyId' in response.response && response.response.companyId) {
          setUserCompanyId(response.response.companyId); // Store user's company ID
          setValue("companyId", response.response.companyId);
          // Fetch company details to show in autocomplete
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
            // Company fetch failed, but we have the ID
          }
        }
      } catch {
        // Silently fail - user can still enter company ID manually
      }
    };

    fetchCurrentEmployee();
  }, [setValue]);

  // Fetch departments when component mounts or companyId changes
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoadingDepartments(true);
      try {
        console.log('Fetching departments for companyId:', companyId);
        const response = await departmentsApi.getDepartments(
          companyId ? { companyId } : undefined
        );
        console.log('Departments fetched:', response.response);
        setDepartments(response.response || []);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        setDepartments([]);
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [companyId]);

  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [employeeCredentials, setEmployeeCredentials] = useState<{
    email: string;
    password: string;
    employeeName: string;
  } | null>(null);

  const handleCompanySelect = (option: AutocompleteOption | null) => {
    if (option) {
      // Check if user is selecting a different company
      if (userCompanyId && option.id !== userCompanyId) {
        setPendingCompanyId(option.id);
        setShowCrossCompanyDialog(true);
      } else {
        setValue("companyId", option.id, { shouldValidate: true });
        setCompanySearchTerm(option.label);
        setRequiresApproval(false);
      }
    } else {
      setValue("companyId", "", { shouldValidate: true });
      setCompanySearchTerm("");
      setRequiresApproval(false);
    }
  };

  const handleCrossCompanyConfirm = () => {
    if (pendingCompanyId) {
      setValue("companyId", pendingCompanyId, { shouldValidate: true });
      const selectedCompany = companyOptions.find(c => c.id === pendingCompanyId);
      if (selectedCompany) {
        setCompanySearchTerm(selectedCompany.label);
      }
      setRequiresApproval(true);
      setShowCrossCompanyDialog(false);
      setPendingCompanyId(null);
    }
  };

  const handleCrossCompanyCancel = () => {
    setShowCrossCompanyDialog(false);
    setPendingCompanyId(null);
    // Reset to user's company if they had one
    if (userCompanyId) {
      setValue("companyId", userCompanyId, { shouldValidate: true });
      const userCompany = companyOptions.find(c => c.id === userCompanyId);
      if (userCompany) {
        setCompanySearchTerm(userCompany.label);
      }
    }
  };

  const handleCompanySearch = (searchTerm: string) => {
    setCompanySearchTerm(searchTerm);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast({
      title: "Copied",
      description: "Copied to clipboard",
      variant: "success",
    });
  };

  const onSubmit = async (data: NewEmployeeFormData) => {
    setIsSaving(true);
    try {
      const response = await employeesApi.createEmployee({
        userEmail: data.userEmail,
        companyId: data.companyId,
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        userCompEmail: data.userCompEmail,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        jobTitle: data.jobTitle,
        department: data.department,
        managerId: data.managerId,
        hireDate: data.hireDate,
        salary: data.salary || undefined,
      });

      // Check if user credentials were created
      if (response.response.userCredentials) {
        setEmployeeCredentials({
          email: response.response.userCredentials.email,
          password: response.response.userCredentials.temporaryPassword,
          employeeName: `${response.response.employee.firstName} ${response.response.employee.lastName}`,
        });
        setShowCredentialsModal(true);
      } else {
        addToast({
          title: "Success",
          description: response.header.responseDetail || "Employee created successfully",
          variant: "success",
        });
        router.push(`/dashboard/employees/${response.response.employee.id}`);
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      addToast({
        title: "Error",
        description: errorMessage,
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
        <Button variant="ghost" onClick={() => router.push("/dashboard/employees")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Employee</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Add a new employee to the system</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    User Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="userEmail"
                    type="email"
                    placeholder="user@example.com"
                    {...register("userEmail")}
                    className={errors.userEmail ? "border-red-500" : ""}
                  />
                  {errors.userEmail && (
                    <p className="text-sm text-red-500 mt-1">{errors.userEmail.message}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter the email of an existing user account. The user must be created first.
                  </p>
                </div>

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
                  <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="employeeId"
                    placeholder="EMP001"
                    {...register("employeeId")}
                    className={errors.employeeId ? "border-red-500" : ""}
                  />
                  {errors.employeeId && (
                    <p className="text-sm text-red-500 mt-1">{errors.employeeId.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="hireDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hire Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="hireDate"
                    type="date"
                    {...register("hireDate")}
                    className={errors.hireDate ? "border-red-500" : ""}
                  />
                  {errors.hireDate && (
                    <p className="text-sm text-red-500 mt-1">{errors.hireDate.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="firstName"
                    {...register("firstName")}
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="lastName"
                    {...register("lastName")}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="userCompEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="userCompEmail"
                    type="email"
                    placeholder="employee@company.com"
                    {...register("userCompEmail")}
                    className={errors.userCompEmail ? "border-red-500" : ""}
                  />
                  {errors.userCompEmail && (
                    <p className="text-sm text-red-500 mt-1">{errors.userCompEmail.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 dark:text-gray-100 font-medium text-sm">
                      +91
                    </span>
                    <input
                      id="phoneNumber"
                      type="tel"
                      {...register("phoneNumber")}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        e.target.value = value;
                        register("phoneNumber").onChange(e);
                      }}
                      maxLength={10}
                      placeholder="98765 43210"
                      className="flex h-10 w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-12 pr-3 py-2 text-sm text-gray-900 dark:text-gray-100 ring-offset-white dark:ring-offset-gray-900 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-sm hover:border-gray-400 dark:hover:border-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register("dateOfBirth")}
                    className={errors.dateOfBirth ? "border-red-500" : ""}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <Input
                    id="address"
                    {...register("address")}
                  />
                </div>

                <div>
                  <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="jobTitle"
                    {...register("jobTitle")}
                    className={errors.jobTitle ? "border-red-500" : ""}
                  />
                  {errors.jobTitle && (
                    <p className="text-sm text-red-500 mt-1">{errors.jobTitle.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="department"
                    {...register("department")}
                    className={`flex h-10 w-full rounded-lg border-2 ${
                      errors.department ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ring-offset-white dark:ring-offset-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-sm hover:border-gray-400 dark:hover:border-gray-500`}
                    disabled={isLoadingDepartments}
                  >
                    <option value="">
                      {isLoadingDepartments ? "Loading departments..." : "Select a department"}
                    </option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="text-sm text-red-500 mt-1">{errors.department.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="managerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Manager ID
                  </label>
                  <Input
                    id="managerId"
                    placeholder="Enter manager ID (optional)"
                    {...register("managerId")}
                  />
                </div>

                <div>
                  <label htmlFor="salary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Salary <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="salary"
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        id="salary"
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="0.00"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Button type="submit" isLoading={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Create Employee
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/employees")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Approval Required Section */}
      {requiresApproval && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Approval Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Cross-Company Employee Creation
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    You are creating an employee for a different company. This action requires approval from the target company's administrator.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Your Company</p>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        {companyOptions.find(c => c.id === userCompanyId)?.label || "Your Company"}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Target Company</p>
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                        {companyOptions.find(c => c.id === companyId)?.label || "Selected Company"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-4 border border-amber-300 dark:border-amber-700">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    What happens next?
                  </h4>
                  <ol className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-600 dark:bg-amber-700 text-white flex items-center justify-center text-xs font-bold">1</span>
                      <span>When you submit this form, an approval request will be created</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-600 dark:bg-amber-700 text-white flex items-center justify-center text-xs font-bold">2</span>
                      <span>The target company's administrator will be notified</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-600 dark:bg-amber-700 text-white flex items-center justify-center text-xs font-bold">3</span>
                      <span>Once approved, the employee will be created in their system</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-600 dark:bg-amber-700 text-white flex items-center justify-center text-xs font-bold">4</span>
                      <span>You will receive a notification about the approval status</span>
                    </li>
                  </ol>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    The employee record will be in <strong>pending</strong> status until approved by the target company.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && employeeCredentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Employee Created Successfully!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Login credentials have been generated for {employeeCredentials.employeeName}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                      Important Security Information
                    </h3>
                    <ul className="mt-2 text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                      <li>• This is a temporary password that will be shown only once</li>
                      <li>• The employee must change this password on first login</li>
                      <li>• Share these credentials through a secure channel</li>
                      <li>• Do not send credentials via unencrypted email</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={employeeCredentials.email}
                      readOnly
                      className="flex-1 font-mono bg-gray-50 dark:bg-gray-800"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(employeeCredentials.email)}
                      className="flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Temporary Password
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={employeeCredentials.password}
                      readOnly
                      className="flex-1 font-mono bg-gray-50 dark:bg-gray-800"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(employeeCredentials.password)}
                      className="flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Employee will be required to change this password on first login
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Next Steps
                </h3>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>1. Copy the credentials above</li>
                  <li>2. Share them securely with the employee (in person, encrypted message, or secure portal)</li>
                  <li>3. Instruct the employee to login and change their password immediately</li>
                  <li>4. Complete any additional employee onboarding steps</li>
                </ol>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setShowCredentialsModal(false);
                    router.push("/dashboard/employees");
                  }}
                  className="flex-1"
                >
                  Go to Employees List
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    copyToClipboard(
                      `Email: ${employeeCredentials.email}\nPassword: ${employeeCredentials.password}`
                    );
                  }}
                  className="flex-shrink-0"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Both
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cross-Company Confirmation Dialog */}
      {showCrossCompanyDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Cross-Company Employee Creation
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                    You are about to create an employee for a different company
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  Important Notice
                </h3>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                  <li>• This action requires approval from the target company's administrator</li>
                  <li>• The employee will be in pending status until approved</li>
                  <li>• You will be notified once the request is reviewed</li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Target Company:</strong>{" "}
                  {companyOptions.find(c => c.id === pendingCompanyId)?.label || "Selected Company"}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleCrossCompanyCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCrossCompanyConfirm}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Yes, Continue
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

