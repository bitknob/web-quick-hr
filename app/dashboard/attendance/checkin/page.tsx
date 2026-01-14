"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogIn, Clock, Calendar, User, CheckCircle } from "lucide-react";
import { attendanceApi } from "@/lib/api/attendance";
import { employeesApi } from "@/lib/api/employees";
import { Attendance, Employee } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { getErrorMessage, formatApiErrorMessage } from "@/lib/utils";

export default function CheckInPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchEmployeeAndTodayAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      const employeeResponse = await employeesApi.getCurrentEmployee();
      
      // Check if response is null (404 case where API returns 200 with null response)
      if (!employeeResponse.response) {
        const errorMessage = formatApiErrorMessage(
          employeeResponse.header.responseMessage,
          employeeResponse.header.responseDetail
        );
        addToast({
          title: "Error",
          description: errorMessage,
          variant: "error",
        });
        setIsLoading(false);
        return;
      }
      
      const employee = employeeResponse.response;
      setCurrentEmployee(employee);

      // Check if already checked in today
      const today = new Date().toISOString().split("T")[0];
      const attendanceResponse = await attendanceApi.getAttendanceByEmployee(employee.id, {
        companyId: employee.companyId,
        startDate: today,
        endDate: today,
      });

      const todayRecord = attendanceResponse.response.find((att) => att.date === today);
      if (todayRecord && todayRecord.checkIn) {
        setTodayAttendance(todayRecord);
        setIsCheckedIn(true);
      } else {
        setTodayAttendance(null);
        setIsCheckedIn(false);
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      addToast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchEmployeeAndTodayAttendance();
  }, [fetchEmployeeAndTodayAttendance]);

  const handleCheckIn = async () => {
    if (!currentEmployee) {
      addToast({
        title: "Error",
        description: "Unable to determine employee information",
        variant: "error",
      });
      return;
    }

    setIsCheckingIn(true);
    try {
      await attendanceApi.checkIn(currentEmployee.id, currentEmployee.companyId);
      addToast({
        title: "Success",
        description: "Checked in successfully",
        variant: "success",
      });
      setIsCheckedIn(true);
      fetchEmployeeAndTodayAttendance();
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      addToast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" onClick={() => router.push("/dashboard/attendance/my")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Check In</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Record your attendance for today</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="inline-block"
                >
                  <div className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-xl text-gray-600 dark:text-gray-400">
                    {formatDate(currentTime)}
                  </div>
                </motion.div>
              </div>

              {isCheckedIn && todayAttendance ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-6"
                >
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <h3 className="text-xl font-semibold text-green-900 dark:text-green-100">
                      Already Checked In
                    </h3>
                  </div>
                  <div className="space-y-2 text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Check In Time</div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {todayAttendance.checkIn
                        ? formatTime(new Date(todayAttendance.checkIn))
                        : "-"}
                    </div>
                    {todayAttendance.checkOut && (
                      <>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-4">Check Out Time</div>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {formatTime(new Date(todayAttendance.checkOut))}
                        </div>
                      </>
                    )}
                    <div className="mt-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        todayAttendance.status === "present"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          : todayAttendance.status === "late"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
                      }`}>
                        {todayAttendance.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center py-8"
                >
                  <Button
                    size="lg"
                    onClick={handleCheckIn}
                    isLoading={isCheckingIn}
                    className="px-12 py-6 text-lg"
                    disabled={isCheckedIn}
                  >
                    <LogIn className="h-6 w-6 mr-3" />
                    Check In Now
                  </Button>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Click the button to record your attendance for today
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {currentEmployee && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Employee Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Name</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {currentEmployee.firstName} {currentEmployee.lastName}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Employee ID</div>
                  <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {currentEmployee.employeeId}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Job Title</div>
                  <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {currentEmployee.jobTitle}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Department</div>
                  <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {currentEmployee.department}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/dashboard/attendance/my")}
              >
                <Clock className="h-4 w-4 mr-2" />
                View My Attendance
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/dashboard/attendance")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                All Attendance Records
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

