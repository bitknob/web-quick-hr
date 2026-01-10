"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslations } from "@/lib/hooks/use-translations";
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
  const t = useTranslations();
  const [userModules, setUserModules] = useState<UserModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchUserModules = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userModulesApi.getAllUserModules({
        isActive: filterActive,
      });
      setUserModules(response.response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: t.toast.error,
        description: errorMessage || t.userModules.failedToFetchUserModules,
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filterActive, addToast, t.userModules.failedToFetchUserModules, t.toast.error]);

  useEffect(() => {
    if (hasFetchedRef.current && filterActive === undefined) return;
    
    const fetchData = async () => {
      if (!hasFetchedRef.current || filterActive !== undefined) {
        hasFetchedRef.current = true;
        await fetchUserModules();
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterActive]);

  const handleDeleteClick = (id: string) => {
    setModuleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!moduleToDelete) return;

    try {
      await userModulesApi.removeUserModule(moduleToDelete);
      addToast({
        title: t.toast.success,
        description: t.userModules.moduleAssignmentRemoved,
        variant: "success",
      });
      fetchUserModules();
      setDeleteDialogOpen(false);
      setModuleToDelete(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: t.toast.error,
        description: errorMessage || t.userModules.failedToRemoveModuleAssignment,
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t.userModules.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t.userModules.description}</p>
        </div>
        <Link href="/dashboard/user-modules/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t.userModules.assignModule}
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
                placeholder={t.userModules.searchByModule}
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
                <option value="all">{t.userModules.allStatus}</option>
                <option value="active">{t.userModules.active}</option>
                <option value="inactive">{t.userModules.inactive}</option>
              </select>
            </div>
            <Button onClick={fetchUserModules} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t.common.refresh}
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
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.userModules.userId}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.userModules.module}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.userModules.moduleName}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.common.status}</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.common.actions}</th>
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
                          {userModule.isActive ? t.userModules.active : t.userModules.inactive}
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
                            onClick={() => handleDeleteClick(userModule.id)}
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
              title={t.userModules.noModuleAssignmentsFound}
              description={searchTerm ? t.userModules.tryDifferentSearch : t.userModules.getStartedByAssigning}
              action={
                !searchTerm
                  ? {
                      label: t.userModules.assignModule,
                      onClick: () => router.push("/dashboard/user-modules/new"),
                    }
                  : undefined
              }
            />
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title={t.dialog.removeModuleAssignment.title}
        message={t.dialog.removeModuleAssignment.message}
        confirmText={t.common.remove}
        cancelText={t.common.cancel}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setModuleToDelete(null);
        }}
      />
    </div>
  );
}

