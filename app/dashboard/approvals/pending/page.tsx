"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, FileCheck } from "lucide-react";
import { approvalsApi } from "@/lib/api/approvals";
import { ApprovalRequest } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime, getErrorMessage } from "@/lib/utils";

export default function PendingApprovalsPage() {
  const { addToast } = useToast();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
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
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      case "approved":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "rejected":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
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

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pending Approvals</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Review and manage pending approval requests</p>
      </motion.div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">Loading approvals...</div>
          </CardContent>
        </Card>
      ) : approvals.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {approvals.map((approval, index) => (
            <motion.div
              key={approval.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                          {approval.requestType.replace("_", " ")}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(approval.status)}`}
                        >
                          {approval.status}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(approval.priority)}`}
                        >
                          {approval.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Step {approval.currentStep} of {approval.totalSteps}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Created: {formatDateTime(approval.createdAt)}
                      </p>
                      {approval.expiresAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Expires: {formatDateTime(approval.expiresAt)}
                        </p>
                      )}
                    </div>
                    {approval.status === "pending" && (
                      <div className="flex items-center gap-2">
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
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileCheck}
          title="No pending approvals"
          description="All approval requests have been processed"
        />
      )}
    </div>
  );
}

