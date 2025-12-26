"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { leavesApi } from "@/lib/api/leaves";
import { employeesApi } from "@/lib/api/employees";
import { Leave } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useTranslations } from "@/lib/hooks/use-translations";
import Link from "next/link";

export default function MyLeaveRequestsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const t = useTranslations();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    
    const fetchCurrentEmployeeLeaves = async () => {
      hasFetchedRef.current = true;
    setIsLoading(true);
    try {
        const employeeResponse = await employeesApi.getCurrentEmployee();
        const employeeId = employeeResponse.response.id;
        const companyId = employeeResponse.response.companyId;

        // Fetch leave requests for current employee
        const response = await leavesApi.getLeavesByEmployee(employeeId, {
          companyId,
        });
        setLeaves(response.response);
      } catch (error) {
        const errorMessage =
          error instanceof Error && "response" in error
            ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header
                ?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch leave requests",
        variant: "error",
      });
        setLeaves([]);
    } finally {
      setIsLoading(false);
    }
    };
    fetchCurrentEmployeeLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Leave Requests</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View your leave request history</p>
        </div>
        <Link href="/dashboard/leave/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Request Leave
          </Button>
        </Link>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable />
          ) : leaves.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Period</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Reason</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave, index) => (
                    <motion.tr
                      key={leave.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/leave/${leave.id}`)}
                    >
                      <td className="py-4 px-4 text-gray-900 dark:text-gray-100 capitalize">
                        {leave.leaveType}
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        {leave.reason || "-"}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        {new Date(leave.createdAt).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title={t.leave.noLeaveRequestsFound}
              description={t.leave.getStartedByCreating}
              action={{
                label: t.leave.requestLeave,
                onClick: () => router.push("/dashboard/leave/create"),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

