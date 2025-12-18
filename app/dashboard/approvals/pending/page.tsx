"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, FileCheck, Eye } from "lucide-react";
import { approvalsApi } from "@/lib/api/approvals";
import { ApprovalRequest } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { formatDateTime, getErrorMessage } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function PendingApprovalsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApprovals = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await approvalsApi.getPendingApprovals();
      setApprovals(response.response);
    } catch (error: unknown) {
      addToast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleApprove = async (id: string) => {
    try {
      await approvalsApi.approveRequest(id, { comments: "Approved" });
      addToast({
        title: "Success",
        description: "Request approved successfully",
        variant: "success",
      });
      fetchApprovals();
    } catch (error: unknown) {
      addToast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "error",
      });
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Please provide a rejection reason:");
    if (!reason) return;

    try {
      await approvalsApi.rejectRequest(id, { rejectionReason: reason });
      addToast({
        title: "Success",
        description: "Request rejected successfully",
        variant: "success",
      });
      fetchApprovals();
    } catch (error: unknown) {
      addToast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "error",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      case "high":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300";
      case "normal":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      case "low":
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
    }
  };

  const formatRequestType = (type: string) => {
    return type.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pending Approvals</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Review and manage pending approval requests</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approval Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable />
          ) : approvals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Priority</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Progress</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Created</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Expires</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((approval, index) => (
                    <motion.tr
                      key={approval.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-4 px-4 text-gray-900 dark:text-gray-100">
                        {formatRequestType(approval.requestType)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(approval.priority)}`}>
                          {approval.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        Step {approval.currentStep} of {approval.totalSteps}
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        {formatDateTime(approval.createdAt)}
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        {approval.expiresAt ? formatDateTime(approval.expiresAt) : "-"}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/approvals/${approval.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(approval.id)}
                            className="text-green-600 hover:text-green-700 hover:border-green-500"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(approval.id)}
                            className="text-red-600 hover:text-red-700 hover:border-red-500"
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
              icon={FileCheck}
              title="No pending approvals"
              description="All approval requests have been processed"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
