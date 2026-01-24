"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Clock, 
  LogIn, 
  LogOut, 
  Calendar, 
  User, 
  Building,
  Edit,
  Trash2,
  AlertCircle
} from "lucide-react";
import { attendanceApi } from "@/lib/api/attendance";
import { Attendance, AttendanceStatus } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { format } from "date-fns";

export default function AttendanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const attendanceId = params.id as string;

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!attendanceId) return;

      try {
        setLoading(true);
        const response = await attendanceApi.getAttendance(attendanceId);
        setAttendance(response.response);
        setError(null);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch attendance record";
        setError(errorMessage);
        setAttendance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [attendanceId]);

  const formatTime = (timeString?: string) => {
    if (!timeString) return null;
    
    try {
      // Try different time formats
      const formats = [
        `1970-01-01T${timeString}`,
        `1970-01-01T${timeString}:00`,
        `1970-01-01T${timeString}.000`,
        timeString, // In case it's already a full datetime
      ];
      
      for (const format of formats) {
        const date = new Date(format);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      return null;
    } catch {
      return null;
    }
  };

  const handleDelete = async () => {
    if (!attendance) return;

    try {
      await attendanceApi.deleteAttendance(attendance.id, attendance.companyId);
      addToast({
        title: "Success",
        description: "Attendance record deleted successfully",
        variant: "success",
      });
      router.push("/dashboard/attendance");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete attendance record";
      addToast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    }
  };

  const getStatusVariant = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return "success";
      case "absent":
        return "error";
      case "late":
        return "warning";
      case "half_day":
        return "info";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Attendance Details</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">View attendance record information</p>
          </div>
        </motion.div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !attendance) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Attendance Details</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">View attendance record information</p>
          </div>
        </motion.div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <div className="text-red-500 text-lg font-medium mb-4">
                {error || "Attendance record not found"}
              </div>
              <Button onClick={() => router.push("/dashboard/attendance")}>
                Back to Attendance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/dashboard/attendance")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Attendance Details</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">View attendance record information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-6 md:grid-cols-2"
      >
        {/* Main Information Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100">
                      {format(new Date(attendance.date), "PPP")}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <div className="mt-1">
                    <Badge variant={getStatusVariant(attendance.status)}>
                      {attendance.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {attendance.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</label>
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <p className="text-gray-900 dark:text-gray-100">{attendance.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Check In</label>
                  <div className="flex items-center gap-2 mt-1">
                    <LogIn className="h-4 w-4 text-green-500" />
                    {attendance.checkIn ? (() => {
                      const time = formatTime(attendance.checkIn);
                      return time ? (
                        <span className="text-gray-900 dark:text-gray-100">
                          {format(time, "p")}
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">Invalid time format</span>
                      );
                    })() : (
                      <span className="text-gray-500 dark:text-gray-400">Not recorded</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Check Out</label>
                  <div className="flex items-center gap-2 mt-1">
                    <LogOut className="h-4 w-4 text-red-500" />
                    {attendance.checkOut ? (() => {
                      const time = formatTime(attendance.checkOut);
                      return time ? (
                        <span className="text-gray-900 dark:text-gray-100">
                          {format(time, "p")}
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">Invalid time format</span>
                      );
                    })() : (
                      <span className="text-gray-500 dark:text-gray-400">Not recorded</span>
                    )}
                  </div>
                </div>

                {attendance.checkIn && attendance.checkOut && (() => {
                  const checkInTime = formatTime(attendance.checkIn);
                  const checkOutTime = formatTime(attendance.checkOut);
                  if (checkInTime && checkOutTime) {
                    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
                    const diffHours = diffMs / (1000 * 60 * 60);
                    return (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Hours</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="text-gray-900 dark:text-gray-100">
                            {diffHours.toFixed(2)} hours
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Employee Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendance.employee ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                  <div className="mt-1">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {attendance.employee.firstName} {attendance.employee.lastName}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee ID</label>
                  <div className="mt-1">
                    <span className="text-gray-900 dark:text-gray-100">
                      {attendance.employee.employeeId}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <div className="mt-1">
                    <span className="text-gray-900 dark:text-gray-100">
                      {attendance.employee.email}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">Employee information not available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Company ID</label>
                <div className="mt-1">
                  <span className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                    {attendance.companyId}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Attendance ID</label>
                <div className="mt-1">
                  <span className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                    {attendance.id}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                <div className="mt-1">
                  <span className="text-gray-900 dark:text-gray-100">
                    {format(new Date(attendance.createdAt), "PPPpp")}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                <div className="mt-1">
                  <span className="text-gray-900 dark:text-gray-100">
                    {format(new Date(attendance.updatedAt), "PPPpp")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Attendance Record"
        message="Are you sure you want to delete this attendance record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        variant="destructive"
      />
    </div>
  );
}
