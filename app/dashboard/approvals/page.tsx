"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Search, FileCheck, Eye } from "lucide-react";
import { approvalsApi } from "@/lib/api/approvals";
import { ApprovalRequest, ApprovalStatus } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { formatDateTime, getErrorMessage } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ApprovalsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "all">("all");
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>("all");

  const fetchApprovals = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: {
        requestType?: string;
        status?: ApprovalStatus;
      } = {};

      if (requestTypeFilter !== "all") {
        params.requestType = requestTypeFilter;
      }
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await approvalsApi.getApprovals(params);
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
  }, [statusFilter, requestTypeFilter, addToast]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      case "approved":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "rejected":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      case "cancelled":
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
      case "expired":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300";
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

  const formatRequestType = (type: string) => {
    return type.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const filteredApprovals = approvals.filter((approval) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesType = approval.requestType.toLowerCase().includes(searchLower);
      const matchesStatus = approval.status.toLowerCase().includes(searchLower);
      return matchesType || matchesStatus;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">All Approvals</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage all approval requests</p>
        </div>
        <Link href="/dashboard/approvals/pending">
          <Button variant="outline">
            <FileCheck className="h-4 w-4 mr-2" />
            View Pending
          </Button>
        </Link>
      </motion.div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search by type or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ApprovalStatus | "all")}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </Select>
              <Select
                value={requestTypeFilter}
                onChange={(e) => setRequestTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="leave">Leave</option>
                <option value="employee_create">Employee Create</option>
                <option value="employee_update">Employee Update</option>
                <option value="employee_transfer">Employee Transfer</option>
                <option value="employee_promotion">Employee Promotion</option>
                <option value="salary_change">Salary Change</option>
                <option value="department_change">Department Change</option>
                <option value="other">Other</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable />
          ) : filteredApprovals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Priority</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Progress</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Created</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Expires</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApprovals.map((approval, index) => (
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
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(approval.status)}`}>
                          {approval.status}
                        </span>
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
              title="No approvals found"
              description={searchTerm || statusFilter !== "all" || requestTypeFilter !== "all"
                ? "Try adjusting your filters"
                : "No approval requests have been created yet"}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
