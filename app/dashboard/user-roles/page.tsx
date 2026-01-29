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
import { getErrorMessage, formatApiErrorMessage, formatRole } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

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
  const { addToast } = useToast();
  const [searchType, setSearchType] = useState<"userId" | "email">("userId");
  const [searchValue, setSearchValue] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("employee");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // ... (previous useEffects)

  // ... (previous helper functions)

  const handleCreateUser = async () => {
    if (!employee && !searchValue) return;
    
    const emailToUse = employee ? employee.userCompEmail : searchValue;
    if (!emailToUse) return;

    if (!confirm(`Are you sure you want to create a user account for ${emailToUse}?`)) return;

    setIsCreatingUser(true);
    setTempPassword(null);

    try {
      const response = await authApi.createUserForEmployee({
        email: emailToUse,
        role: "employee", // Default role
        companyName: employee ? undefined : "Unknown Company", // API fetches from employee if available, fallback if not
      });

      if (response.response) {
        setTempPassword(response.response.temporaryPassword);
        addToast({
          title: "Success",
          description: `User account created successfully! Temporary password: ${response.response.temporaryPassword}`,
          variant: "success"
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      addToast({
        title: "Error",
        description: errorMessage,
        variant: "error"
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleResendCredentials = async () => {
    if (!foundUser) return;
    
    if (!confirm(`Are you sure you want to reset credentials for ${foundUser.email}? This will invalidate their current password.`)) return;

    setIsResending(true);
    setTempPassword(null);

    try {
      const response = await authApi.resendCredentials(foundUser.email, "Quick HR");
      
      if (response.response) {
        setTempPassword(response.response.temporaryPassword);
        addToast({
          title: "Success",
          description: `Credentials reset successfully! Temporary password: ${response.response.temporaryPassword}`,
          variant: "success"
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      addToast({
        title: "Error",
        description: errorMessage,
        variant: "error"
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleAssignRole = async () => {
    // ... (existing implementation)
    if (!foundUser) {
        addToast({
          title: "Error",
          description: employee 
            ? `Cannot assign role: ${employee.firstName} ${employee.lastName} hasn't created a user account yet.`
            : "Please search for a user first",
          variant: "error"
        });
        return;
      }
  
      if (foundUser.role === selectedRole) {
        addToast({
          title: "Error",
          description: "User already has this role",
          variant: "error"
        });
        return;
      }
  
      setLoading(true);
  
      try {
        const response = await authApi.assignRole(foundUser.id, selectedRole);
        
        // Check if response is null (error case)
        if (!response.response) {
          const errorMessage = formatApiErrorMessage(
            response.header.responseMessage,
            response.header.responseDetail
          );
          addToast({
            title: "Error",
            description: errorMessage,
            variant: "error"
          });
          setLoading(false);
          return;
        }
        
        setFoundUser(response.response);
        const successMessage = formatApiErrorMessage(
          response.header.responseMessage,
          response.header.responseDetail
        );
        addToast({
          title: "Success",
          description: successMessage || `Role successfully updated to ${selectedRole}`,
          variant: "success"
        });
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        addToast({
          title: "Error",
          description: errorMessage,
          variant: "error"
        });
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
            variant="outline" 
            size="sm"
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
                    {/* ... (existing fields) ... */} 
                    <div className="rounded-lg p-4 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Employee Name</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {employee.firstName} {employee.lastName}
                      </p>
                    </div>
                    <div className="rounded-lg p-4 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                       <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                       <p className="text-sm text-gray-900 dark:text-gray-100">{employee.userCompEmail}</p>
                    </div>
                    {/* ... other fields ... */}
                  </div>

                  {!foundUser && !searching && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">No User Account</h4>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                            This employee does not have a user account linked to {employee.userCompEmail}.
                          </p>
                          <Button 
                            onClick={handleCreateUser} 
                            isLoading={isCreatingUser}
                            size="sm"
                            className="bg-yellow-600 hover:bg-yellow-700 text-white border-none"
                          >
                            Create User Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : searchParams.get("userId") && foundUser ? (
                 /* User Details View (when userId is in URL) */
                 /* ... existing code ... */
                 <div className="space-y-4">
                    {/* ... user details ... */}
                    {/* Resend Credentials Button for this view */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <Button
                            variant="outline"
                            onClick={handleResendCredentials}
                            isLoading={isResending}
                            className="w-full"
                        >
                            Reset & Resend Credentials
                        </Button>
                    </div>
                 </div>
              ) : (
                /* Search User View */
                <>
                  {/* ... existing search form ... */}
                  
                   {/* Found User Display */}
                  {foundUser && (
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                       {/* ... existing details ... */}
                       
                        {/* Resend Credentials Button */}
                       <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <Button
                                variant="outline"
                                onClick={handleResendCredentials}
                                isLoading={isResending}
                                size="sm"
                                className="w-full bg-white dark:bg-gray-800"
                            >
                                Reset & Resend Credentials
                            </Button>
                       </div>
                    </div>
                  )}
                  
                  {/* Create User Button for Search mode if user not found but search looks like email */}
                  {!foundUser && !searching && searchType === 'email' && searchValue && (
                     <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                       <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">User Not Found</h4>
                       <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                         Would you like to create a user account for {searchValue}?
                       </p>
                       <Button 
                         onClick={handleCreateUser} 
                         isLoading={isCreatingUser}
                         size="sm"
                         className="w-full bg-yellow-600 hover:bg-yellow-700 text-white border-none"
                       >
                         Create User Account
                       </Button>
                     </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* ... Assign Role Card ... */}
        {/* ... Message Display ... */}
        
         {/* Temp Password Display */}
         {tempPassword && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-1 lg:col-span-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center"
            >
              <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">Temporary Password Generated</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please share this password with the user securely. They will be required to change it on login.
              </p>
              <div className="bg-white dark:bg-gray-900 p-4 rounded border border-green-200 dark:border-green-800 inline-block">
                <code className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100 tracking-wider select-all">
                  {tempPassword}
                </code>
              </div>
            </motion.div>
          )}

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

    </div>
  );
}
