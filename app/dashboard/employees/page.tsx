"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Users } from "lucide-react";
import { employeesApi } from "@/lib/api/employees";
import { Employee } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslations } from "@/lib/hooks/use-translations";
import Link from "next/link";

const getEmployeeInitials = (firstName: string, lastName: string): string => {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return first + last || "U";
};

export default function EmployeesPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const t = useTranslations();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const limit = 20;
  const hasFetchedRef = useRef(false);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await employeesApi.searchEmployees({
        page: currentPage,
        limit: limit,
        searchTerm: searchTerm || undefined,
      });
      setEmployees(response.response);
      
      // Extract pagination info from header if available
      const headerDetail = response.header?.responseDetail || "";
      const totalMatch = headerDetail.match(/Total: (\d+)/);
      const totalPagesMatch = headerDetail.match(/Total Pages: (\d+)/);
      
      if (totalMatch) {
        setTotalEmployees(parseInt(totalMatch[1]));
      }
      if (totalPagesMatch) {
        setTotalPages(parseInt(totalPagesMatch[1]));
      } else if (totalMatch) {
        setTotalPages(Math.ceil(parseInt(totalMatch[1]) / limit));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: t.toast.error,
        description: errorMessage || t.employees.failedToFetchEmployees,
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, limit, addToast, t.employees.failedToFetchEmployees, t.toast.error]);

  useEffect(() => {
    const fetchData = async () => {
      if (!hasFetchedRef.current || searchTerm !== "" || currentPage !== 1) {
        hasFetchedRef.current = true;
        await fetchEmployees();
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDeleteClick = (id: string) => {
    setEmployeeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;

    try {
      await employeesApi.deleteEmployee(employeeToDelete);
      addToast({
        title: t.toast.success,
        description: t.employees.employeeDeleted,
        variant: "success",
      });
      fetchEmployees();
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: t.toast.error,
        description: errorMessage || t.employees.failedToDeleteEmployee,
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t.employees.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t.employees.description}</p>
        </div>
        <Link href="/dashboard/employees/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t.employees.addEmployee}
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
                placeholder={t.employees.searchEmployees}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchEmployees()}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchEmployees}>{t.common.search}</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable />
          ) : employees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.employees.name}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.employees.email}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.employees.jobTitle}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.employees.department}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.employees.status}</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee, index) => (
                    <motion.tr
                      key={employee.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {/* Note: Employee profile images would come from User model, for now showing initials */}
                          <div className="h-10 w-10 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {getEmployeeInitials(employee.firstName, employee.lastName)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{employee.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{employee.userCompEmail}</td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{employee.jobTitle}</td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{employee.department}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            employee.status === "active"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                              : employee.status === "inactive"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                              : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                          }`}
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/employees/${employee.id}`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(employee.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
                    {t.employees.showing} {((currentPage - 1) * limit) + 1} {t.employees.to} {Math.min(currentPage * limit, totalEmployees)} {t.employees.of} {totalEmployees} {t.employees.employees}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title={t.employees.noEmployeesFound}
              description={t.employees.getStartedByCreating}
              action={{
                label: t.employees.addEmployee,
                onClick: () => router.push("/dashboard/employees/create"),
              }}
            />
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title={t.dialog.deleteEmployee.title}
        message={t.dialog.deleteEmployee.message}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setEmployeeToDelete(null);
        }}
      />
    </div>
  );
}

