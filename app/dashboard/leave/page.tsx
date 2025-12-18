"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { approvalsApi } from "@/lib/api/approvals";
import { ApprovalRequest } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth-store";

export default function LeavePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { user } = useAuthStore();
  const [leaveRequests, setLeaveRequests] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role && ["super_admin", "provider_admin", "provider_hr_staff", "hrbp", "company_admin"].includes(user.role);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    setIsLoading(true);
    try {
      const response = await approvalsApi.getApprovals({
        requestType: "leave",
      });
      setLeaveRequests(response.response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch leave requests",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
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

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leave Requests</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage leave requests</p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/leave/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Request Leave
            </Button>
          </Link>
        )}
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>All Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable />
          ) : leaveRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Period</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((request, index) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-4 px-4 text-gray-900 dark:text-gray-100">
                        {request.requestData?.leaveType || "Leave"}
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        {request.requestData?.startDate && request.requestData?.endDate
                          ? `${new Date(request.requestData.startDate).toLocaleDateString()} - ${new Date(request.requestData.endDate).toLocaleDateString()}`
                          : "-"}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No leave requests found"
              description="Get started by creating a new leave request"
              action={{
                label: "Request Leave",
                onClick: () => router.push("/dashboard/leave/create"),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

