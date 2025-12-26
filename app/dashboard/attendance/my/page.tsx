"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut, TrendingUp } from "lucide-react";
import { attendanceApi } from "@/lib/api/attendance";
import { employeesApi } from "@/lib/api/employees";
import { Attendance, AttendanceStats } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useTranslations } from "@/lib/hooks/use-translations";

export default function MyAttendancePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const t = useTranslations();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const hasFetchedRef = useRef(false);

  const fetchMyAttendance = useCallback(async (employeeId: string, companyId: string) => {
    setIsLoading(true);
    try {
      const response = await attendanceApi.getAttendanceByEmployee(employeeId, {
        companyId,
      });
      setAttendances(response.response);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header
              ?.responseMessage
          : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch attendance records",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const fetchStats = useCallback(async (employeeId: string, companyId: string) => {
    if (!employeeId || !companyId) {
      return;
    }
    setIsLoadingStats(true);
    try {
      const now = new Date();
      const response = await attendanceApi.getAttendanceStats(employeeId, companyId, {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
      setStats(response.response);
    } catch (error) {
      // Silently fail for stats - not critical
      console.error("Failed to fetch attendance stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    
    const fetchCurrentEmployee = async () => {
      hasFetchedRef.current = true;
      try {
        const response = await employeesApi.getCurrentEmployee();
        const employee = response.response;
        
        if (employee?.id && employee?.companyId) {
          setCurrentEmployeeId(employee.id);
          setCurrentCompanyId(employee.companyId);
          fetchMyAttendance(employee.id, employee.companyId);
          fetchStats(employee.id, employee.companyId);
        } else {
          setIsLoading(false);
        }
      } catch {
        addToast({
          title: "Error",
          description: "Failed to fetch employee information",
          variant: "error",
        });
        setIsLoading(false);
      }
    };
    fetchCurrentEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckIn = async () => {
    if (!currentEmployeeId || !currentCompanyId) {
      addToast({
        title: "Error",
        description: "Unable to determine employee or company information",
        variant: "error",
      });
      return;
    }

    setIsCheckingIn(true);
    try {
      await attendanceApi.checkIn(currentEmployeeId, currentCompanyId);
      addToast({
        title: "Success",
        description: "Checked in successfully",
        variant: "success",
      });
      fetchMyAttendance(currentEmployeeId, currentCompanyId);
      fetchStats(currentEmployeeId, currentCompanyId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header
              ?.responseMessage
          : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to check in",
        variant: "error",
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!currentEmployeeId || !currentCompanyId) {
      addToast({
        title: "Error",
        description: "Unable to determine employee or company information",
        variant: "error",
      });
      return;
    }

    setIsCheckingOut(true);
    try {
      await attendanceApi.checkOut(currentEmployeeId, currentCompanyId);
      addToast({
        title: "Success",
        description: "Checked out successfully",
        variant: "success",
      });
      fetchMyAttendance(currentEmployeeId, currentCompanyId);
      fetchStats(currentEmployeeId, currentCompanyId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header
              ?.responseMessage
          : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to check out",
        variant: "error",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "absent":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      case "late":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      case "half_day":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View your attendance records and statistics</p>
        </div>
        {currentEmployeeId && currentCompanyId && (
          <div className="flex gap-3">
            <Button onClick={handleCheckIn} isLoading={isCheckingIn} variant="outline">
              <LogIn className="h-4 w-4 mr-2" />
              Check In
            </Button>
            <Button onClick={handleCheckOut} isLoading={isCheckingOut} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Check Out
            </Button>
          </div>
        )}
      </motion.div>

      {stats && !isLoadingStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Working Days</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.workingDays}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Present Days</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.presentDays}</p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Absent Days</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.absentDays}</p>
                </div>
                <Clock className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Leave Days</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.leaveDays}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Late Days</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.lateDays}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Half Days</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.halfDayDays}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>My Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable />
          ) : attendances.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Check In</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Check Out</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((attendance, index) => (
                    <motion.tr
                      key={attendance.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/attendance/${attendance.id}`)}
                    >
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300 font-medium">
                        {new Date(attendance.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        {formatTime(attendance.checkIn)}
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        {formatTime(attendance.checkOut)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(attendance.status)}`}>
                          {attendance.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300 text-sm">
                        {attendance.notes || "-"}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title={t.attendance.noAttendanceRecordsFound}
              description={t.attendance.recordsWillAppear}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

