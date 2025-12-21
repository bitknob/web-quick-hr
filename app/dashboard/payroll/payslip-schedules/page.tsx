"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Play, Pause, ChevronRight, Calendar } from "lucide-react";
import { payrollApi } from "@/lib/api/payroll";
import { PayslipSchedule } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const getFrequencyLabel = (frequency: string): string => {
  const labels: Record<string, string> = {
    monthly: "Monthly",
    biweekly: "Biweekly",
    weekly: "Weekly",
    custom: "Custom",
  };
  return labels[frequency] || frequency;
};

const getStatusColor = (status?: string): string => {
  if (!status) return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
  const colors: Record<string, string> = {
    active: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    inactive: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
    paused: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
  };
  return colors[status] || colors.inactive;
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "Not scheduled";
  return new Date(dateString).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function PayslipSchedulesPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [schedules, setSchedules] = useState<PayslipSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const companyId = "placeholder"; // Replace with actual companyId
      const response = await payrollApi.getPayslipSchedulesByCompany(companyId);
      setSchedules(response.response || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch payslip schedules",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Payslip Schedules</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automate payslip generation with scheduled runs
          </p>
        </div>
        <Link href="/dashboard/payroll/payslip-schedules/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </Button>
        </Link>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Payslip Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : schedules.length > 0 ? (
            <div className="space-y-4">
              {schedules.map((schedule, index) => (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/dashboard/payroll/payslip-schedules/${schedule.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                          <Clock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {schedule.scheduleName}
                            </h3>
                            <Badge className={getStatusColor(schedule.status)}>
                              {schedule.status || "inactive"}
                            </Badge>
                            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                              {getFrequencyLabel(schedule.frequency)}
                            </Badge>
                            {schedule.autoApprove && (
                              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                Auto Approve
                              </Badge>
                            )}
                            {schedule.autoSend && (
                              <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                                Auto Send
                              </Badge>
                            )}
                          </div>
                          {schedule.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              {schedule.description}
                            </p>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div>
                              <span className="block">Generation Time:</span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {schedule.generationTime} ({schedule.timezone})
                              </span>
                            </div>
                            {schedule.generationDay && (
                              <div>
                                <span className="block">Day:</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  Day {schedule.generationDay}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="block">Next Run:</span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {formatDate(schedule.nextRunAt)}
                              </span>
                            </div>
                            <div>
                              <span className="block">Trigger:</span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                                {schedule.triggerType}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="No payslip schedules found"
              description="Create a schedule to automate payslip generation"
              action={{
                label: "Create Schedule",
                onClick: () => router.push("/dashboard/payroll/payslip-schedules/new"),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

