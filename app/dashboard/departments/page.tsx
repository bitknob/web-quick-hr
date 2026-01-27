"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Building2 } from "lucide-react";
import { departmentsApi } from "@/lib/api/departments";
import { employeesApi } from "@/lib/api/employees";
import { Department, Employee } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslations } from "@/lib/hooks/use-translations";
import Link from "next/link";

export default function DepartmentsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const t = useTranslations();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [departmentHeads, setDepartmentHeads] = useState<Record<string, Employee>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null);
  const hasFetchedEmployeeRef = useRef(false);

  useEffect(() => {
    if (hasFetchedEmployeeRef.current) return;
    
    const fetchCurrentEmployee = async () => {
      hasFetchedEmployeeRef.current = true;
      try {
        const response = await employeesApi.getCurrentEmployee();
        const data = response.response;
        if ("companyId" in data && data.companyId) {
          setCompanyId(data.companyId);
        }
      } catch {
        // Silently fail - API will auto-filter by user's company
      }
    };
    fetchCurrentEmployee();
  }, []);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    try {
      // API will auto-filter by user's company if companyId is not provided
      const response = await departmentsApi.getDepartments({
        companyId: companyId || undefined,
      });
      setDepartments(response.response);

      // Fetch department heads
      const headIds = response.response
        .filter((dept) => dept.headId)
        .map((dept) => dept.headId!);
      
      if (headIds.length > 0) {
        const headPromises = headIds.map(async (id) => {
          try {
            const empResponse = await employeesApi.getEmployee(id);
            return { id, employee: empResponse.response };
          } catch {
            return null;
          }
        });
        const heads = await Promise.all(headPromises);
        const headsMap: Record<string, Employee> = {};
        heads.forEach((head) => {
          if (head) {
            headsMap[head.id] = head.employee;
          }
        });
        setDepartmentHeads(headsMap);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: t.toast.error,
        description: errorMessage || t.departments.failedToFetchDepartments,
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [companyId, addToast, t.departments.failedToFetchDepartments, t.toast.error]);

  const hasFetchedDepartmentsRef = useRef(false);
  
  useEffect(() => {
    if (hasFetchedDepartmentsRef.current && companyId === null) return;
    
    const fetchData = async () => {
      if (companyId !== null || hasFetchedDepartmentsRef.current === false) {
        hasFetchedDepartmentsRef.current = true;
        await fetchDepartments();
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleDeleteClick = (id: string) => {
    setDepartmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!departmentToDelete) return;

    try {
      await departmentsApi.deleteDepartment(departmentToDelete);
      addToast({
        title: t.toast.success,
        description: t.departments.departmentDeleted,
        variant: "success",
      });
      fetchDepartments();
      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: t.toast.error,
        description: errorMessage || t.departments.failedToDeleteDepartment,
        variant: "error",
      });
    }
  };

  const filteredDepartments = departments.filter((dept) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      dept.name.toLowerCase().includes(search) ||
      dept.description?.toLowerCase().includes(search)
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t.departments.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t.departments.description}</p>
        </div>
        <Link href="/dashboard/departments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t.departments.addDepartment}
          </Button>
        </Link>
      </motion.div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder={t.departments.searchDepartments}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchDepartments}>{t.common.refresh}</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable />
          ) : filteredDepartments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.departments.name}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.departments.departmentDescription}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.departments.departmentHead}</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.map((department, index) => {
                    const head = department.headId ? departmentHeads[department.headId] : null;
                    return (
                      <motion.tr
                        key={department.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {department.name}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                          {department.description || "-"}
                        </td>
                        <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                          {head ? (
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {head.firstName} {head.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {head.userCompEmail}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">{t.departments.notAssigned}</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/departments/${department.id}`}>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(department.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Building2}
              title={t.departments.noDepartmentsFound}
              description={searchTerm ? t.departments.tryDifferentSearch : t.departments.getStartedByCreating}
              action={
                !searchTerm
                  ? {
                      label: t.departments.addDepartment,
                      onClick: () => router.push("/dashboard/departments/new"),
                    }
                  : undefined
              }
            />
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title={t.dialog.deleteDepartment.title}
        message={t.dialog.deleteDepartment.message}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDepartmentToDelete(null);
        }}
      />
    </div>
  );
}

