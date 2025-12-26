"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Shield, RefreshCw } from "lucide-react";
import { rolesApi } from "@/lib/api/roles";
import { Role } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslations } from "@/lib/hooks/use-translations";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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

export default function RolesPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const t = useTranslations();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSystemRole, setFilterSystemRole] = useState<boolean | undefined>(undefined);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<{ id: string; isSystemRole: boolean } | null>(null);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await rolesApi.getRoles({
        isSystemRole: filterSystemRole,
        isActive: filterActive,
      });
      setRoles(response.response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: t.toast.error,
        description: errorMessage || t.roles.failedToFetchRoles,
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filterSystemRole, filterActive, addToast, t.roles.failedToFetchRoles, t.toast.error]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleDeleteClick = (id: string, isSystemRole: boolean) => {
    if (isSystemRole) {
      addToast({
        title: t.toast.error,
        description: t.roles.systemRolesCannotBeDeleted,
        variant: "error",
      });
      return;
    }
    setRoleToDelete({ id, isSystemRole });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;

    try {
      await rolesApi.deleteRole(roleToDelete.id);
      addToast({
        title: t.toast.success,
        description: t.roles.roleDeleted,
        variant: "success",
      });
      fetchRoles();
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: t.toast.error,
        description: errorMessage || t.roles.failedToDeleteRole,
        variant: "error",
      });
    }
  };

  const filteredRoles = roles.filter((role) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      role.name.toLowerCase().includes(search) ||
      role.roleKey.toLowerCase().includes(search) ||
      role.description?.toLowerCase().includes(search)
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t.roles.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t.roles.description}</p>
        </div>
        <Link href="/dashboard/roles/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t.roles.addRole}
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
                placeholder={t.roles.searchRoles}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterSystemRole === undefined ? "all" : filterSystemRole ? "system" : "custom"}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilterSystemRole(value === "all" ? undefined : value === "system");
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="all">{t.roles.allRoles}</option>
                <option value="system">{t.roles.systemRoles}</option>
                <option value="custom">{t.roles.customRoles}</option>
              </select>
              <select
                value={filterActive === undefined ? "all" : filterActive ? "active" : "inactive"}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilterActive(value === "all" ? undefined : value === "active");
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="all">{t.roles.allStatus}</option>
                <option value="active">{t.roles.active}</option>
                <option value="inactive">{t.roles.inactive}</option>
              </select>
            </div>
            <Button onClick={fetchRoles} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t.common.refresh}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable />
          ) : filteredRoles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.roles.role}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.roles.key}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap min-w-[80px]">{t.roles.level}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.roles.type}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.roles.status}</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((role, index) => (
                    <motion.tr
                      key={role.id || `role-${index}-${role.roleKey || 'unknown'}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {role.name}
                        </div>
                        {role.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {role.description}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                          {role.roleKey}
                        </code>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <Badge className={`${getHierarchyLevelColor(role.hierarchyLevel)} whitespace-nowrap`}>
                          {t.roles.level} {role.hierarchyLevel}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        {role.isSystemRole ? (
                          <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {t.roles.system}
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                            {t.roles.custom}
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          className={
                            role.isActive
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                              : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                          }
                        >
                          {role.isActive ? t.roles.active : t.roles.inactive}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/roles/${role.id}`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          {!role.isSystemRole && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(role.id, role.isSystemRole)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Shield}
              title={t.roles.noRolesFound}
              description={searchTerm ? t.roles.tryDifferentSearch : t.roles.getStartedByCreating}
              action={
                !searchTerm
                  ? {
                      label: t.roles.addRole,
                      onClick: () => router.push("/dashboard/roles/new"),
                    }
                  : undefined
              }
            />
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title={t.dialog.deleteRole.title}
        message={t.dialog.deleteRole.message}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setRoleToDelete(null);
        }}
      />
    </div>
  );
}

