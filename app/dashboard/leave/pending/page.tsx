"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Calendar, Eye } from "lucide-react";
import { leavesApi } from "@/lib/api/leaves";
import { employeesApi } from "@/lib/api/employees";
import { Leave } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useTranslations } from "@/lib/hooks/use-translations";

export default function PendingLeavesPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const t = useTranslations();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchPendingLeaves = useCallback(async (companyId?: string) => {
    setIsLoading(true);
    try {
      const response = await leavesApi.getPendingLeaves(companyId);
      setLeaves(response.response);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header
              ?.responseMessage
          : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch pending leave requests",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    
    const fetchCompanyId = async () => {
      hasFetchedRef.current = true;
      try {
        const employeeResponse = await employeesApi.getCurrentEmployee();
        const companyId = employeeResponse.response.companyId;
        setCurrentCompanyId(companyId);
        fetchPendingLeaves(companyId);
      } catch {
        // If we can't get company ID, try fetching without it
        fetchPendingLeaves();
      }
    };
    fetchCompanyId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (id: string) => {
    setProcessingIds((prev) => new Set(prev).add(id));
    try {
      await leavesApi.approveLeave(id, currentCompanyId || undefined);
      addToast({
        title: "Success",
        description: "Leave request approved successfully",
        variant: "success",
      });
      fetchPendingLeaves(currentCompanyId || undefined);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header
              ?.responseMessage
          : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to approve leave request",
        variant: "error",
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleReject = async (id: string) => {
    setProcessingIds((prev) => new Set(prev).add(id));
    try {
      await leavesApi.rejectLeave(id, currentCompanyId || undefined);
      addToast({
        title: "Success",
        description: "Leave request rejected successfully",
        variant: "success",
      });
      fetchPendingLeaves(currentCompanyId || undefined);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header
              ?.responseMessage
          : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to reject leave request",
        variant: "error",
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pending Leave Requests</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Review and approve or reject leave requests</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests Awaiting Approval</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable />
          ) : leaves.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Employee</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Leave Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Period</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Reason</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Requested</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave, index) => (
                    <motion.tr
                      key={leave.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-4 px-4 text-gray-900 dark:text-gray-100">
                        {leave.employee
                          ? `${leave.employee.firstName} ${leave.employee.lastName}`
                          : leave.employeeId}
                        {leave.employee?.employeeId && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">
                            {leave.employee.employeeId}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-gray-100 capitalize">
                          {leave.leaveType}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        <div className="flex flex-col">
                          <span>{new Date(leave.startDate).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">to</span>
                          <span>{new Date(leave.endDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300 max-w-xs">
                        <div className="truncate" title={leave.reason || "-"}>
                          {leave.reason || "-"}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        {new Date(leave.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/leave/${leave.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(leave.id)}
                            disabled={processingIds.has(leave.id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(leave.id)}
                            disabled={processingIds.has(leave.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
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
              icon={Calendar}
              title={t.leave.noPendingLeaveRequests}
              description={t.leave.noPendingDescription}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

