"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Building,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { leavesApi } from "@/lib/api/leaves";
import { Leave, LeaveStatus, LeaveType } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { format, differenceInDays } from "date-fns";

export default function LeaveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [leave, setLeave] = useState<Leave | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const leaveId = params.id as string;

  useEffect(() => {
    const fetchLeave = async () => {
      if (!leaveId) return;

      try {
        setLoading(true);
        const response = await leavesApi.getLeave(leaveId);
        setLeave(response.response);
        setError(null);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch leave request";
        setError(errorMessage);
        setLeave(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLeave();
  }, [leaveId]);

  const handleDelete = async () => {
    if (!leave) return;

    try {
      await leavesApi.deleteLeave(leave.id, leave.companyId);
      addToast({
        title: "Success",
        description: "Leave request deleted successfully",
        variant: "success",
      });
      router.push("/dashboard/leave");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete leave request";
      addToast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    }
  };

  const handleApprove = async () => {
    if (!leave) return;

    try {
      setActionLoading("approve");
      await leavesApi.approveLeave(leave.id, leave.companyId);
      addToast({
        title: "Success",
        description: "Leave request approved successfully",
        variant: "success",
      });
      // Refresh the leave data
      const response = await leavesApi.getLeave(leave.id);
      setLeave(response.response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to approve leave request";
      addToast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!leave) return;

    try {
      setActionLoading("reject");
      await leavesApi.rejectLeave(leave.id, leave.companyId);
      addToast({
        title: "Success",
        description: "Leave request rejected successfully",
        variant: "success",
      });
      // Refresh the leave data
      const response = await leavesApi.getLeave(leave.id);
      setLeave(response.response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reject leave request";
      addToast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!leave) return;

    try {
      setActionLoading("cancel");
      await leavesApi.cancelLeave(leave.id, leave.companyId);
      addToast({
        title: "Success",
        description: "Leave request cancelled successfully",
        variant: "success",
      });
      // Refresh the leave data
      const response = await leavesApi.getLeave(leave.id);
      setLeave(response.response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to cancel leave request";
      addToast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusVariant = (status: LeaveStatus) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "pending":
        return "warning";
      case "cancelled":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: LeaveStatus) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getLeaveTypeDisplay = (type: LeaveType) => {
    switch (type) {
      case "annual":
        return "Annual Leave";
      case "sick":
        return "Sick Leave";
      case "casual":
        return "Casual Leave";
      case "maternity":
        return "Maternity Leave";
      case "paternity":
        return "Paternity Leave";
      case "unpaid":
        return "Unpaid Leave";
      default:
        return type;
    }
  };

  const calculateDays = () => {
    if (!leave) return 0;
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    return differenceInDays(end, start) + 1; // Include both start and end dates
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leave Details</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">View leave request information</p>
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

  if (error || !leave) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leave Details</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">View leave request information</p>
          </div>
        </motion.div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <div className="text-red-500 text-lg font-medium mb-4">
                {error || "Leave request not found"}
              </div>
              <Button onClick={() => router.push("/dashboard/leave")}>
                Back to Leave
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
          <Button variant="ghost" onClick={() => router.push("/dashboard/leave")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leave Details</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">View leave request information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(leave.status)} className="gap-1">
            {getStatusIcon(leave.status)}
            {leave.status.toUpperCase()}
          </Badge>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        {/* Main Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Leave Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Leave Type</label>
                  <div className="mt-1">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {getLeaveTypeDisplay(leave.leaveType)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100">
                      {format(new Date(leave.startDate), "PPP")}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">End Date</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100">
                      {format(new Date(leave.endDate), "PPP")}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</label>
                  <div className="mt-1">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {calculateDays()} day(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <div className="mt-1">
                    <Badge variant={getStatusVariant(leave.status)} className="gap-1">
                      {getStatusIcon(leave.status)}
                      {leave.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {leave.approvedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved/Rejected At</label>
                    <div className="mt-1">
                      <span className="text-gray-900 dark:text-gray-100">
                        {format(new Date(leave.approvedAt), "PPPpp")}
                      </span>
                    </div>
                  </div>
                )}

                {leave.reason && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Reason</label>
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <p className="text-gray-900 dark:text-gray-100">{leave.reason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Employee Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leave.employee ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                    <div className="mt-1">
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {leave.employee.firstName} {leave.employee.lastName}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee ID</label>
                    <div className="mt-1">
                      <span className="text-gray-900 dark:text-gray-100">
                        {leave.employee.employeeId}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                    <div className="mt-1">
                      <span className="text-gray-900 dark:text-gray-100">
                        {leave.employee.email}
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

          {/* Approval Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Approval Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leave.approver ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved By</label>
                    <div className="mt-1">
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {leave.approver.firstName} {leave.approver.lastName}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Approver ID</label>
                    <div className="mt-1">
                      <span className="text-gray-900 dark:text-gray-100">
                        {leave.approver.employeeId}
                      </span>
                    </div>
                  </div>

                  {leave.approvedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Approval Date</label>
                      <div className="mt-1">
                        <span className="text-gray-900 dark:text-gray-100">
                          {format(new Date(leave.approvedAt), "PPPpp")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {leave.status === "pending" 
                      ? "Awaiting approval" 
                      : "Approval information not available"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Company ID</label>
                  <div className="mt-1">
                    <span className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                      {leave.companyId}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Leave ID</label>
                  <div className="mt-1">
                    <span className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                      {leave.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                  <div className="mt-1">
                    <span className="text-gray-900 dark:text-gray-100">
                      {format(new Date(leave.createdAt), "PPPpp")}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                  <div className="mt-1">
                    <span className="text-gray-900 dark:text-gray-100">
                      {format(new Date(leave.updatedAt), "PPPpp")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-end gap-3"
      >
        {leave.status === "pending" && (
          <>
            <Button 
              variant="default" 
              onClick={handleApprove}
              isLoading={actionLoading === "approve"}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              isLoading={actionLoading === "reject"}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </>
        )}
        
        {leave.status === "approved" && (
          <Button 
            variant="outline" 
            onClick={handleCancel}
            isLoading={actionLoading === "cancel"}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Cancel Leave
          </Button>
        )}

        <Button variant="outline" onClick={() => setDeleteDialogOpen(true)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Leave Request"
        message="Are you sure you want to delete this leave request? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        variant="destructive"
      />
    </div>
  );
}
