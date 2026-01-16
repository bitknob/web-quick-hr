"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/auth";
import { employeesApi } from "@/lib/api/employees";
import { User, UserRole, Employee } from "@/lib/types";
import { getErrorMessage, formatApiErrorMessage } from "@/lib/utils";

const AVAILABLE_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: "super_admin", label: "Super Admin", description: "Full system access" },
  { value: "provider_admin", label: "Provider Admin", description: "Provider-level administration" },
  { value: "provider_hr_staff", label: "Provider HR Staff", description: "Provider HR operations" },
  { value: "hrbp", label: "HRBP", description: "HR Business Partner" },
  { value: "company_admin", label: "Company Admin", description: "Company-level administration" },
  { value: "department_head", label: "Department Head", description: "Department management" },
  { value: "manager", label: "Manager", description: "Team management" },
  { value: "employee", label: "Employee", description: "Basic employee access" },
];

export default function UserRoleManagementPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchType, setSearchType] = useState<"userId" | "email">("userId");
  const [searchValue, setSearchValue] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("employee");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadCurrentUser();
    
    // Check for URL parameters and auto-populate
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");
    const employeeName = searchParams.get("employeeName");
    const employeeId = searchParams.get("employeeId");
    
    // Handle userId parameter - fetch user details directly
    if (userId) {
      setSearchType("userId");
      setSearchValue(userId);
      
      // If employeeId is provided, fetch full employee data from API
      if (employeeId) {
        fetchEmployeeData(employeeId);
      }
      
      // Auto-search for user by userId (silent mode - no success message)
      setTimeout(() => {
        handleSearchWithValue(userId, "userId", true);
      }, 500);
    } else if (email) {
      setSearchType("email");
      setSearchValue(email);
      
      // If we have employee info from URL params, create employee object
      if (employeeName && employeeId) {
        const [firstName, ...lastNameParts] = employeeName.split(' ');
        const lastName = lastNameParts.join(' ');
        setEmployee({
          id: '',
          userEmail: email,
          companyId: '',
          employeeId: employeeId,
          firstName: firstName,
          lastName: lastName,
          userCompEmail: email,
          phoneNumber: '',
          jobTitle: '',
          department: '',
          hireDate: '',
          status: 'active',
          profileImageUrl: '',
          createdAt: '',
          updatedAt: ''
        } as Employee);
      }
      
      // Auto-search for user by email (silent mode - no success message)
      setTimeout(() => {
        handleSearchWithValue(email, "email", true);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadCurrentUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      setCurrentUser(response.response);
    } catch (error) {
      console.error("Failed to load current user:", error);
    }
  };

  const fetchEmployeeData = async (employeeId: string) => {
    try {
      const response = await employeesApi.getEmployee(employeeId);
      if (response.response) {
        setEmployee(response.response);
      }
    } catch (error) {
      console.error("Failed to load employee data:", error);
    }
  };

  const handleSearchWithValue = async (value: string, type: "userId" | "email", silent: boolean = false) => {
    if (!value.trim()) return;

    setSearching(true);
    setMessage(null);
    setFoundUser(null);

    try {
      let response;
      if (type === "userId") {
        response = await authApi.getUserRole(value.trim());
      } else {
        response = await authApi.getUserRoleByEmail(value.trim());
      }
      
      // Check if response is null (404 case where API returns 200 with null response)
      if (!response.response) {
        const errorMessage = formatApiErrorMessage(
          response.header.responseMessage,
          response.header.responseDetail
        );
        
        // Provide a more helpful message for email searches (common from employee detail page)
        const helpfulMessage = type === "email" 
          ? `${errorMessage}. The employee needs to sign up using this email address before a role can be assigned.`
          : errorMessage;
        
        setMessage({ type: "error", text: helpfulMessage });
        setFoundUser(null);
        setSearching(false);
        return;
      }
      
      setFoundUser(response.response);
      setSelectedRole(response.response.role);
      // Only show success message if not silent (i.e., manual search)
      if (!silent) {
        setMessage({ type: "success", text: "User found successfully" });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      
      // Provide a more helpful message for email searches
      const helpfulMessage = type === "email" 
        ? `${errorMessage}. The employee needs to sign up using this email address before a role can be assigned.`
        : errorMessage;
      
      setMessage({ type: "error", text: helpfulMessage });
      setFoundUser(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setMessage({ type: "error", text: "Please enter a search value" });
      return;
    }

    await handleSearchWithValue(searchValue, searchType);
  };

  const handleAssignRole = async () => {
    if (!foundUser) {
      setMessage({ 
        type: "error", 
        text: employee 
          ? `Cannot assign role: ${employee.firstName} ${employee.lastName} hasn't created a user account yet. They need to sign up first using their email: ${employee.userCompEmail}`
          : "Please search for a user first" 
      });
      return;
    }

    if (foundUser.role === selectedRole) {
      setMessage({ type: "error", text: "User already has this role" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await authApi.assignRole(foundUser.id, selectedRole);
      
      // Check if response is null (error case)
      if (!response.response) {
        const errorMessage = formatApiErrorMessage(
          response.header.responseMessage,
          response.header.responseDetail
        );
        setMessage({ type: "error", text: errorMessage });
        setLoading(false);
        return;
      }
      
      setFoundUser(response.response);
      const successMessage = formatApiErrorMessage(
        response.header.responseMessage,
        response.header.responseDetail
      );
      setMessage({ type: "success", text: successMessage || `Role successfully updated to ${selectedRole}` });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const canAssignRoles = currentUser?.role === "super_admin" || currentUser?.role === "provider_admin";
  const canAssignSuperAdmin = currentUser?.role === "super_admin";

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        {/* Show back button if coming from employee details */}
        {(searchParams.get("userId") || searchParams.get("email")) && (
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">User Role Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Assign and manage user roles across the system</p>
        </div>
      </motion.div>

      {/* Permission Check */}
      {!canAssignRoles && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">Insufficient Permissions</h3>
              <p className="text-red-700 dark:text-red-300 text-sm">
                You need to be a Super Admin or Provider Admin to assign roles.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Details or Search User Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {employee ? (
                  <>
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Employee Details
                  </>
                ) : searchParams.get("userId") && foundUser ? (
                  <>
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    User Details
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search User
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {employee ? (
                /* Employee Details View */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg p-4 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Employee Name</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {employee.firstName} {employee.lastName}
                      </p>
                    </div>
                    <div className="rounded-lg p-4 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Employee ID</p>
                      <p className="font-mono text-sm text-gray-900 dark:text-gray-100">{employee.employeeId}</p>
                    </div>
                    <div className="rounded-lg p-4 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{employee.userCompEmail}</p>
                    </div>
                    <div className="rounded-lg p-4 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Department</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{employee.department}</p>
                    </div>
                    <div className="rounded-lg p-4 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Job Title</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{employee.jobTitle}</p>
                    </div>
                    <div className="rounded-lg p-4 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        employee.status === 'active' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                      }`}>
                        {employee.status}
                      </span>
                    </div>
                  </div>
                </div>
              ) : searchParams.get("userId") && foundUser ? (
                /* User Details View (when userId is in URL) */
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      User Details
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="rounded-lg p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">User ID</p>
                          <p className="font-mono text-xs text-gray-900 dark:text-gray-100 break-all">{foundUser.id}</p>
                        </div>
                        <div className="rounded-lg p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Email</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{foundUser.email}</p>
                        </div>
                        {foundUser.phoneNumber && (
                          <div className="rounded-lg p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{foundUser.phoneNumber}</p>
                          </div>
                        )}
                        <div className="rounded-lg p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current Role</p>
                          <span className="inline-flex px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white rounded-full text-xs font-semibold">
                            {foundUser.role}
                          </span>
                        </div>
                        <div className="rounded-lg p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Email Verified</p>
                          <span className={`inline-flex items-center gap-1 font-medium text-sm ${foundUser.isEmailVerified ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                            {foundUser.isEmailVerified ? (
                              <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Yes
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                No
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Search User View */
                <>
                  {/* Search Type Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search By</label>
                    <div className="flex gap-2">
                      <Button
                        variant={searchType === "userId" ? "default" : "outline"}
                        onClick={() => {
                          setSearchType("userId");
                          setMessage(null);
                          setFoundUser(null);
                        }}
                        className="flex-1"
                      >
                        User ID
                      </Button>
                      <Button
                        variant={searchType === "email" ? "default" : "outline"}
                        onClick={() => {
                          setSearchType("email");
                          setMessage(null);
                          setFoundUser(null);
                        }}
                        className="flex-1"
                      >
                        Email
                      </Button>
                    </div>
                  </div>

                  {/* Search Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {searchType === "userId" ? "User ID" : "Email Address"}
                    </label>
                    <Input
                      type={searchType === "email" ? "email" : "text"}
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder={searchType === "userId" ? "Enter user UUID" : "user@example.com"}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>

                  {/* Search Button */}
                  <Button
                    onClick={handleSearch}
                    disabled={searching || !canAssignRoles}
                    className="w-full"
                    isLoading={searching}
                  >
                    {searching ? "Searching..." : "Search User"}
                  </Button>

                  {/* Found User Display */}
                  {foundUser && (
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        User Found
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">ID:</span>
                          <span className="font-mono text-gray-900 dark:text-gray-100 text-xs break-all">{foundUser.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Email:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{foundUser.email}</span>
                        </div>
                        {foundUser.phoneNumber && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{foundUser.phoneNumber}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Current Role:</span>
                          <span className="px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white rounded-full text-xs font-semibold">
                            {foundUser.role}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Email Verified:</span>
                          <span className={`font-medium ${foundUser.isEmailVerified ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                            {foundUser.isEmailVerified ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Assign Role Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Assign Role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select Role</label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {AVAILABLE_ROLES.map((role) => {
                    const isDisabled = role.value === "super_admin" && !canAssignSuperAdmin;
                    const isSelected = selectedRole === role.value;
                    return (
                      <button
                        key={role.value}
                        onClick={() => !isDisabled && setSelectedRole(role.value)}
                        disabled={isDisabled}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                        } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{role.label}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{role.description}</div>
                          </div>
                          {isSelected && (
                            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        {isDisabled && (
                          <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Only Super Admins can assign this role
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={handleAssignRole}
                disabled={loading || !canAssignRoles}
                className="w-full"
                isLoading={loading}
              >
                {loading ? "Assigning Role..." : "Assign Role"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Message Display */}
      {message && !(employee && message.type === "error" && message.text.includes("search for a user")) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border-2 ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {message.type === "success" ? (
              <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className="font-medium">{message.text}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
