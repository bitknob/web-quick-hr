"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, CheckCircle2, XCircle, Building2, Eye, Lock } from "lucide-react";
import { rolesApi } from "@/lib/api/roles";
import { Role } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const getHierarchyLevelColor = (level: number): string => {
  const colors: Record<number, string> = {
    1: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
    2: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    3: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300",
    4: "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300",
    5: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    6: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
    7: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300",
    8: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300",
  };
  return colors[level] || "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
};

export default function RoleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hierarchy, setHierarchy] = useState<Role[]>([]);
  const [children, setChildren] = useState<Role[]>([]);
  const [parents, setParents] = useState<Role[]>([]);

  useEffect(() => {
    if (params.id) {
      fetchRoleData(params.id as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchRoleData = async (id: string) => {
    setIsLoading(true);
    try {
      const [roleResponse, hierarchyResponse, childrenResponse, parentsResponse] = await Promise.all([
        rolesApi.getRole(id),
        rolesApi.getRoleHierarchy(id).catch(() => ({ response: [] })),
        rolesApi.getChildRoles(id).catch(() => ({ response: [] })),
        rolesApi.getParentRoles(id).catch(() => ({ response: [] })),
      ]);

      setRole(roleResponse.response);
      setHierarchy(hierarchyResponse.response);
      setChildren(childrenResponse.response);
      setParents(parentsResponse.response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch role",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading role...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Role not found</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/roles")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Roles
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
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/roles")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {role.name}
            </h1>
            <Badge className={getHierarchyLevelColor(role.hierarchyLevel)}>
              Level {role.hierarchyLevel}
            </Badge>
            {role.isSystemRole && (
              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                System Role
              </Badge>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {role.description || "Role Details"}
          </p>
        </div>
        {!role.isSystemRole && (
          <Link href={`/dashboard/roles/${role.id}/edit`}>
            <Button>Edit Role</Button>
          </Link>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Role Key</label>
                  <Lock className="h-3 w-3 text-gray-400 dark:text-gray-500 ml-auto" />
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3">
                  <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {role.roleKey}
                  </code>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                  <Lock className="h-3 w-3 text-gray-400 dark:text-gray-500 ml-auto" />
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{role.name}</p>
                </div>
              </div>
              {role.description && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                    <Lock className="h-3 w-3 text-gray-400 dark:text-gray-500 ml-auto" />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{role.description}</p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                <div>
                  <Badge
                    className={
                      role.isActive
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                    }
                  >
                    {role.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              {role.companyId && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Company ID</label>
                    <Lock className="h-3 w-3 text-gray-400 dark:text-gray-500 ml-auto" />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3">
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">{role.companyId}</p>
                  </div>
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
              <CardTitle>Access Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">All Companies</span>
                {role.canAccessAllCompanies ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Multiple Companies</span>
                {role.canAccessMultipleCompanies ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Single Company</span>
                {role.canAccessSingleCompany ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Manage Companies</span>
                {role.canManageCompanies ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Create Companies</span>
                {role.canCreateCompanies ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Manage Provider Staff</span>
                {role.canManageProviderStaff ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Manage Employees</span>
                {role.canManageEmployees ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Approve Leaves</span>
                {role.canApproveLeaves ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">View Payroll</span>
                {role.canViewPayroll ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {role.menuAccess && role.menuAccess.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Menu Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {role.menuAccess.map((menu) => (
                    <Badge key={menu} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {menu}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {role.permissions && Object.keys(role.permissions).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Custom Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {role.permissions && Object.entries(role.permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{key}</span>
                      <Badge className={value ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300"}>
                        {String(value)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {hierarchy.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>Role Hierarchy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {hierarchy.map((hierRole, index) => (
                    <div
                      key={hierRole.id}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        hierRole.id === role.id
                          ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500"
                          : "bg-gray-50 dark:bg-gray-800/50"
                      }`}
                    >
                      <Badge className={getHierarchyLevelColor(hierRole.hierarchyLevel)}>
                        L{hierRole.hierarchyLevel}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {hierRole.name}
                          {hierRole.id === role.id && " (Current)"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {hierRole.roleKey}
                        </div>
                      </div>
                      {index < hierarchy.length - 1 && (
                        <div className="text-gray-400 dark:text-gray-600">↓</div>
                      )}
                    </div>
                  ))}
                </div>
                {children.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Child Roles</h4>
                    <div className="space-y-2">
                      {children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                        >
                          <Badge className={getHierarchyLevelColor(child.hierarchyLevel)}>
                            L{child.hierarchyLevel}
                          </Badge>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{child.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{child.roleKey}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

