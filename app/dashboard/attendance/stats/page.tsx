"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Calendar, TrendingUp, Clock, BarChart3, Target } from "lucide-react";
import { attendanceApi } from "@/lib/api/attendance";
import { employeesApi } from "@/lib/api/employees";
import { AttendanceStats, Employee } from "@/lib/types";
import { useToast } from "@/components/ui/toast";

export default function AttendanceStatsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const hasFetchedEmployeeRef = useRef(false);

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const fetchStats = useCallback(async (employeeId: string, companyId: string, month: number, year: number) => {
    setIsLoading(true);
    try {
      const response = await attendanceApi.getAttendanceStats(employeeId, companyId, {
        month,
        year,
      });
      setStats(response.response);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header
              ?.responseMessage
          : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch attendance statistics",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        let employee: Employee;
        if (!hasFetchedEmployeeRef.current) {
          hasFetchedEmployeeRef.current = true;
          const response = await employeesApi.getCurrentEmployee();
          employee = response.response;
          setCurrentEmployee(employee);
        } else {
          employee = currentEmployee!;
        }
        
        if (employee?.id && employee?.companyId) {
          fetchStats(employee.id, employee.companyId, selectedMonth, selectedYear);
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
    fetchEmployee();
  }, [selectedMonth, selectedYear, fetchStats, addToast, currentEmployee]);

  const attendancePercentage = stats
    ? stats.workingDays > 0
      ? Math.round((stats.presentDays / stats.workingDays) * 100)
      : 0
    : 0;

  const presentPercentage = stats
    ? stats.workingDays > 0
      ? Math.round((stats.presentDays / stats.workingDays) * 100)
      : 0
    : 0;

  const absentPercentage = stats
    ? stats.workingDays > 0
      ? Math.round((stats.absentDays / stats.workingDays) * 100)
      : 0
    : 0;

  const leavePercentage = stats
    ? stats.workingDays > 0
      ? Math.round((stats.leaveDays / stats.workingDays) * 100)
      : 0
    : 0;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/dashboard/attendance/my")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Attendance Statistics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">View detailed attendance statistics and insights</p>
          </div>
        </div>
      </motion.div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Period
            </CardTitle>
            {currentEmployee && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {currentEmployee.firstName} {currentEmployee.lastName}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Month
              </label>
              <Select
                id="month"
                value={selectedMonth.toString()}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex-1">
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Year
              </label>
              <Select
                id="year"
                value={selectedYear.toString()}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Working Days</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      {stats.workingDays}
                    </p>
                  </div>
                  <BarChart3 className="h-10 w-10 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Present Days</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                      {stats.presentDays}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {presentPercentage}% of working days
                    </p>
                  </div>
                  <Clock className="h-10 w-10 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Absent Days</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                      {stats.absentDays}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {absentPercentage}% of working days
                    </p>
                  </div>
                  <Clock className="h-10 w-10 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Leave Days</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {stats.leaveDays}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {leavePercentage}% of working days
                    </p>
                  </div>
                  <Calendar className="h-10 w-10 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Late Days</p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                      {stats.lateDays}
                    </p>
                  </div>
                  <Clock className="h-10 w-10 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Half Days</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                      {stats.halfDayDays}
                    </p>
                  </div>
                  <Clock className="h-10 w-10 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Attendance Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Overall Attendance
                      </span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {attendancePercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${attendancePercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="bg-green-600 h-4 rounded-full"
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Present: </span>
                        <span className="font-semibold text-green-600">{stats.presentDays}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Absent: </span>
                        <span className="font-semibold text-red-600">{stats.absentDays}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Leaves: </span>
                        <span className="font-semibold text-blue-600">{stats.leaveDays}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Total Days: </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {stats.workingDays}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-green-600"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Present</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{stats.presentDays} days</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-red-600"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Absent</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">{stats.absentDays} days</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">On Leave</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{stats.leaveDays} days</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-yellow-600"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Late Arrivals</span>
                    </div>
                    <span className="text-lg font-bold text-yellow-600">{stats.lateDays} days</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-purple-600"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Half Days</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">{stats.halfDayDays} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No statistics available for the selected period</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

