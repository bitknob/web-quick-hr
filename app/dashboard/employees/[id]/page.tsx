"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Shield, UserCog, Send, Trash2, Users, UserPlus, FileText, KeyRound } from "lucide-react";
import { employeesApi } from "@/lib/api/employees";
import { companiesApi } from "@/lib/api/companies";
import { authApi } from "@/lib/api/auth";
import { Employee, User, Company } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Controller } from "react-hook-form";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Autocomplete, AutocompleteOption } from "@/components/ui/autocomplete";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getErrorMessage, formatApiErrorMessage, formatRole, debounce } from "@/lib/utils";
import Link from "next/link";

const employeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  jobTitle: z.string().min(1, "Job title is required"),
  department: z.string().min(1, "Department is required"),
  salary: z.number().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isResendingCredentials, setIsResendingCredentials] = useState(false);
  const [showResendConfirmDialog, setShowResendConfirmDialog] = useState(false);
  const [directReports, setDirectReports] = useState<Employee[]>([]);
  const [isLoadingDirectReports, setIsLoadingDirectReports] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [managerOptions, setManagerOptions] = useState<AutocompleteOption[]>([]);
  const [isSearchingManagers, setIsSearchingManagers] = useState(false);
  const [selectedNewManager, setSelectedNewManager] = useState<AutocompleteOption | null>(null);
  const [showTransferUI, setShowTransferUI] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
  });

  useEffect(() => {
    if (params.id) {
      fetchEmployee(params.id as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchEmployee = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await employeesApi.getEmployee(id);
      
      // Check if response is null (404 case where API returns 200 with null response)
      if (!response.response) {
        const fullMessage = formatApiErrorMessage(
          response.header.responseMessage,
          response.header.responseDetail
        );
        
        addToast({
          title: "Error",
          description: fullMessage,
          variant: "error",
        });
        setIsLoading(false);
        return;
      }
      
      setEmployee(response.response);
      
      // Fetch company details
      try {
        const companyResponse = await companiesApi.getCompany(response.response.companyId);
        setCompany(companyResponse.response);
      } catch (error) {
        console.error("Failed to fetch company details:", error);
        // Continue without company details
      }
      
      reset({
        firstName: response.response.firstName,
        lastName: response.response.lastName,
        email: response.response.userCompEmail,
        phoneNumber: response.response.phoneNumber || "",
        jobTitle: response.response.jobTitle,
        department: response.response.department,
        salary: response.response.salary,
      });
      // Fetch user role information using email
      if (response.response.userCompEmail) {
        fetchUserRole(response.response.userCompEmail);
      }
      // Fetch direct reports
      fetchDirectReports(response.response.id);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch employee",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRole = async (email: string) => {
    // Only fetch if email is provided
    if (!email || !email.includes('@')) {
      setIsLoadingUser(false);
      return;
    }

    setIsLoadingUser(true);
    try {
      const response = await authApi.getUserRoleByEmail(email);
      setUser(response.response);
    } catch {
      // Silently fail - user role is optional information
      // This happens when the employee doesn't have a user account yet (400 error)
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const fetchDirectReports = async (managerId: string) => {
    setIsLoadingDirectReports(true);
    try {
      const response = await employeesApi.getDirectReports(managerId);
      setDirectReports(response.response || []);
    } catch (error) {
      console.error("Failed to fetch direct reports:", error);
    } finally {
      setIsLoadingDirectReports(false);
    }
  };

  const searchManagersImpl = async (searchTerm: string) => {
    setIsSearchingManagers(true);
    try {
      if (!employee) return;
      
      const response = await employeesApi.getPotentialManagers(employee.id, searchTerm);
      
      const options = response.response.map((emp) => ({
        id: emp.id,
        label: `${emp.firstName} ${emp.lastName}`,
        subtitle: `${emp.jobTitle} - ${emp.employeeId}`,
      }));
      setManagerOptions(options);
    } catch {
      setManagerOptions([]);
    } finally {
      setIsSearchingManagers(false);
    }
  };

  const searchManagers = useMemo(
    () => debounce(searchManagersImpl, 300),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [employee]
  );

  const handleDelete = async () => {
    if (!employee) return;
    
    if (!confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await employeesApi.deleteEmployee(employee.id);
      addToast({
        title: "Success",
        description: "Employee deleted successfully",
        variant: "success",
      });
      router.push("/dashboard/employees");
    } catch (error: unknown) {
      addToast({
        title: "Error",
        description: getErrorMessage(error) || "Failed to delete employee",
        variant: "error",
      });
      setIsDeleting(false);
    }
  };

  const handleTransfer = async () => {
    if (!employee || !selectedNewManager) return;

    setIsTransferring(true);
    try {
      await employeesApi.transferEmployee(employee.id, {
        newManagerId: selectedNewManager.id,
      });
      addToast({
        title: "Success",
        description: "Employee transferred successfully",
        variant: "success",
      });
      // Refresh employee data
      fetchEmployee(employee.id);
      setShowTransferUI(false);
      setSelectedNewManager(null);
    } catch (error: unknown) {
      addToast({
        title: "Error",
        description: getErrorMessage(error) || "Failed to transfer employee",
        variant: "error",
      });
    } finally {
      setIsTransferring(false);
    }
  };



  const handleResendCredentials = () => {
    if (!user?.email || !employee) return;
    setShowResendConfirmDialog(true);
  };

  const confirmResendCredentials = async () => {
    if (!user?.email || !employee) return;
    setShowResendConfirmDialog(false);

    setIsResendingCredentials(true);
    try {
      const companyName = company?.name || "Unknown Company";
      const response = await authApi.resendCredentials(user.email, companyName);
      const { temporaryPassword } = response.response;
      
      addToast({
        title: "Success",
        description: `Credentials sent! Temp Password: ${temporaryPassword}`,
        variant: "success",
      });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      addToast({
        title: "Error",
        description: errorMessage || "Failed to resend credentials",
        variant: "error",
      });
    } finally {
      setIsResendingCredentials(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setIsResending(true);
    try {
      await authApi.resendVerification(user.email);
      addToast({
        title: "Success",
        description: user.mustChangePassword ? "Authentication mail sent successfully" : "Verification link sent successfully",
        variant: "success",
      });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      addToast({
        title: "Error",
        description: errorMessage || "Failed to send verification link",
        variant: "error",
      });
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    if (!employee) return;

    setIsSaving(true);
    try {
      await employeesApi.updateEmployee(employee.id, data);
      addToast({
        title: "Success",
        description: "Employee updated successfully",
        variant: "success",
      });
      fetchEmployee(employee.id);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      addToast({
        title: "Error",
        description: errorMessage || "Failed to update employee",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading employee...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Employee not found</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/employees")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Employees
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/employees")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Employee ID: {employee.employeeId}</p>
        </div>
      </motion.div>

      {/* User Role Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                User Role Information
              </CardTitle>
              {user && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendCredentials}
                    isLoading={isResendingCredentials}
                    className="gap-2 text-amber-600 hover:text-amber-700 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20"
                  >
                    <KeyRound className="h-4 w-4" />
                    Resend Credentials
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/user-roles?userId=${user.id}&employeeId=${employee.id}`)}
                    className="gap-2"
                  >
                    <UserCog className="h-4 w-4" />
                    Manage User Role
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingUser ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-600 dark:text-gray-400">Loading user role...</p>
              </div>
            ) : user ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg p-4 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">User ID</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-gray-100">{user.id}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Role</p>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white rounded-full text-sm font-semibold">
                        {formatRole(user.role)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email Verified</p>
                      <div className="flex items-center gap-2">
                        {user.isEmailVerified ? (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">Verified</span>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">Not Verified</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {!user.isEmailVerified && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={isResending}
                        className="text-xs h-7 ml-2"
                      >
                        {isResending ? (
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <Send className="h-3 w-3 mr-2" />
                        )}
                        {isResending ? (
                          user.mustChangePassword ? "Sending Authentication Mail..." : "Sending..."
                        ) : (
                          user.mustChangePassword ? "Send Authentication Mail" : "Resend Link"
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Account Created</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Click &quot;Manage User Role&quot; to assign or change this user&#39;s role in the system
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">No User Account Linked</h4>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        This employee doesn&lsquo;t have a user account yet. Create a user account and assign a role to enable system access.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Next Steps
                  </h4>
                  <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-700 text-white flex items-center justify-center text-xs font-bold">1</span>
                      <span>The employee should sign up using their email: <strong className="font-mono">{employee.userCompEmail}</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-700 text-white flex items-center justify-center text-xs font-bold">2</span>
                      <span>After signup, go to <strong>User Role Management</strong> to assign their role</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-700 text-white flex items-center justify-center text-xs font-bold">3</span>
                      <span>The employee will then be able to access the system with their assigned permissions</span>
                    </li>
                  </ol>
                </div>

                <Button
                  variant="default"
                  onClick={() => router.push(`/dashboard/user-roles?email=${encodeURIComponent(employee.userCompEmail)}&employeeName=${encodeURIComponent(`${employee.firstName} ${employee.lastName}`)}&employeeId=${encodeURIComponent(employee.employeeId)}`)}
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Assign User Role
                </Button>
              </div>
            )}
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
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name
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
                    Last Name
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
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
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
                  <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Job Title
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
                    Department
                  </label>
                  <Input
                    id="department"
                    {...register("department")}
                    className={errors.department ? "border-red-500" : ""}
                  />
                  {errors.department && (
                    <p className="text-sm text-red-500 mt-1">{errors.department.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="salary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Salary
                  </label>
                  <Controller
                    name="salary"
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        id="salary"
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" isLoading={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Organization Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manager Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Reporting Manager
                </h4>
                {employee.manager ? (
                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {employee.manager.firstName} {employee.manager.lastName}
                      </p>
                      <Link href={`/dashboard/employees/${employee.manager.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{employee.manager.jobTitle}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">{employee.manager.userCompEmail}</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-dashed border-gray-200 dark:border-gray-800 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No manager assigned</p>
                  </div>
                )}
                
                {showTransferUI ? (
                  <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 space-y-3">
                    <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100">Select New Manager</h5>
                    <Autocomplete
                      placeholder="Search for new manager..."
                      options={managerOptions}
                      value={selectedNewManager?.id}
                      onSelect={(option) => setSelectedNewManager(option)}
                      onSearch={searchManagers}
                      isLoading={isSearchingManagers}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setShowTransferUI(false);
                        setSelectedNewManager(null);
                      }}>
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        disabled={!selectedNewManager || isTransferring}
                        onClick={handleTransfer}
                        isLoading={isTransferring}
                      >
                        Confirm Transfer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowTransferUI(true)} className="w-full">
                    Change Manager (Transfer)
                  </Button>
                )}
              </div>

              {/* Direct Reports Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Direct Reports ({directReports.length})
                </h4>
                {isLoadingDirectReports ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto text-gray-400" />
                  </div>
                ) : directReports.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {directReports.map((report) => (
                      <Link key={report.id} href={`/dashboard/employees/${report.id}`}>
                        <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {report.firstName} {report.lastName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{report.jobTitle}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                              <FileText className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-lg border border-dashed border-gray-200 dark:border-gray-800 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No direct reports</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-red-100 dark:border-red-900/30">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-100">Delete Employee</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Permanently delete this employee and all associated data. This action cannot be undone.
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                Delete Employee
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <ConfirmDialog
        isOpen={showResendConfirmDialog}
        title="Resend Credentials"
        message="Are you sure you want to reset the password and resend credentials? The user will be required to change their password on the next login."
        confirmText="Yes, Resend"
        cancelText="Cancel"
        onConfirm={confirmResendCredentials}
        onCancel={() => setShowResendConfirmDialog(false)}
        variant="default"
      />
    </div>
  );
}

