"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Package, RefreshCw } from "lucide-react";
import { userModulesApi } from "@/lib/api/user-modules";
import { UserModule } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const moduleColors: Record<string, string> = {
  employees: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
  payroll: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
  leave: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
  attendance: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
  approvals: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
  departments: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300",
  companies: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300",
  reports: "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300",
  settings: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300",
};

export default function UserModulesPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [userModules, setUserModules] = useState<UserModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [userMap, setUserMap] = useState<Record<string, { email: string; name?: string }>>({});

  const fetchUserModules = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userModulesApi.getAllUserModules({
        isActive: filterActive,
      });
      setUserModules(response.response);

      // Fetch user details for display
      const userIds = [...new Set(response.response.map((um) => um.userId))];
      const userDetails: Record<string, { email: string; name?: string }> = {};
      
      // Note: In a real app, you'd have a users API to fetch user details
      // For now, we'll just store the userId and display it
      userIds.forEach((userId) => {
        userDetails[userId] = { email: userId.substring(0, 8) + "..." };
      });
      setUserMap(userDetails);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch user modules",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filterActive, addToast]);

  useEffect(() => {
    fetchUserModules();
  }, [fetchUserModules]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this module assignment?")) return;

    try {
      await userModulesApi.removeUserModule(id);
      addToast({
        title: "Success",
        description: "Module assignment removed successfully",
        variant: "success",
      });
      fetchUserModules();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to remove module assignment",
        variant: "error",
      });
    }
  };

  const filteredUserModules = userModules.filter((um) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      um.moduleKey.toLowerCase().includes(search) ||
      um.moduleName.toLowerCase().includes(search) ||
      um.userId.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">User Modules</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage module assignments for users</p>
        </div>
        <Link href="/dashboard/user-modules/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Assign Module
          </Button>
        </Link>
      </motion.div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 relative min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search by module, user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterActive === undefined ? "all" : filterActive ? "active" : "inactive"}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilterActive(value === "all" ? undefined : value === "active");
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <Button onClick={fetchUserModules} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable />
          ) : filteredUserModules.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">User ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Module</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Module Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUserModules.map((userModule, index) => (
                    <motion.tr
                      key={userModule.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <code className="text-sm text-gray-700 dark:text-gray-300">
                          {userModule.userId}
                        </code>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={moduleColors[userModule.moduleKey] || moduleColors.settings}>
                          {userModule.moduleKey}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        {userModule.moduleName}
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          className={
                            userModule.isActive
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                              : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                          }
                        >
                          {userModule.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/user-modules/${userModule.id}`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(userModule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="No module assignments found"
              description={searchTerm ? "Try a different search term" : "Get started by assigning a module to a user"}
              action={
                !searchTerm
                  ? {
                      label: "Assign Module",
                      onClick: () => router.push("/dashboard/user-modules/new"),
                    }
                  : undefined
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

