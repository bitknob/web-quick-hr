"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, FileText, CheckCircle, XCircle, Lock } from "lucide-react";
import { payrollApi } from "@/lib/api/payroll";
import { PayrollRun } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300",
    processing: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    completed: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    locked: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
    failed: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
  };
  return colors[status] || colors.draft;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return CheckCircle;
    case "failed":
      return XCircle;
    case "locked":
      return Lock;
    default:
      return Calendar;
  }
};

const getMonthName = (month: number): string => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "";
};

export default function PayrollRunsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPayrollRuns = useCallback(async () => {
    setIsLoading(true);
    try {
      const companyId = "placeholder"; // Replace with actual companyId
      const response = await payrollApi.getPayrollRunsByCompany(companyId, { page, limit: 20 });
      const data = response.response;
      setPayrollRuns(data.data || []);
      setTotalPages(Math.ceil((data.total || 0) / (data.limit || 20)));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch payroll runs",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, addToast]);

  useEffect(() => {
    fetchPayrollRuns();
  }, [fetchPayrollRuns]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Payroll Runs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage all payroll processing runs
          </p>
        </div>
        <Link href="/dashboard/payroll/runs/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Payroll Run
          </Button>
        </Link>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : payrollRuns.length > 0 ? (
            <>
              <div className="space-y-4">
                {payrollRuns.map((run, index) => {
                  const StatusIcon = getStatusIcon(run.status);
                  return (
                    <motion.div
                      key={run.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link href={`/dashboard/payroll/runs/${run.id}`}>
                        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                              <StatusIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                  {getMonthName(run.payrollMonth)} {run.payrollYear}
                                </h3>
                                <Badge className={getStatusColor(run.status)}>
                                  {run.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <FileText className="h-4 w-4" />
                                  {run.totalEmployees} employees
                                </span>
                                <span>Processed: {run.processedEmployees}</span>
                                {run.failedEmployees > 0 && (
                                  <span className="text-red-600">
                                    Failed: {run.failedEmployees}
                                  </span>
                                )}
                                {run.createdAt && (
                                  <span>
                                    Created: {new Date(run.createdAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No payroll runs found"
              description="Create your first payroll run to get started"
              action={{
                label: "Create Payroll Run",
                onClick: () => router.push("/dashboard/payroll/runs/new"),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

