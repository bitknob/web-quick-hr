"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { leavesApi } from "@/lib/api/leaves";
import { employeesApi } from "@/lib/api/employees";
import { useToast } from "@/components/ui/toast";
import { useTranslations } from "@/lib/hooks/use-translations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LeaveType } from "@/lib/types";

const leaveRequestSchema = z.object({
  leaveType: z.enum(["annual", "sick", "casual", "maternity", "paternity", "unpaid"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
});

type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

export default function CreateLeaveRequestPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const t = useTranslations();
  const [isSaving, setIsSaving] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leaveType: "annual",
    },
  });

  const startDate = watch("startDate");

  useEffect(() => {
    const fetchCurrentEmployee = async () => {
      try {
        const response = await employeesApi.getCurrentEmployee();
        const data = response.response;
        if ("companyId" in data) {
          setCurrentEmployeeId(data.id);
          setCurrentCompanyId(data.companyId);
        }
      } catch {
        // Silently fail
      }
    };
    fetchCurrentEmployee();
  }, []);

  const onSubmit = async (data: LeaveRequestFormData) => {
    if (!currentEmployeeId || !currentCompanyId) {
      addToast({
        title: "Error",
        description: "Unable to determine employee or company information",
        variant: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      await leavesApi.createLeave({
        employeeId: currentEmployeeId,
        companyId: currentCompanyId,
        leaveType: data.leaveType as LeaveType,
          startDate: data.startDate,
          endDate: data.endDate,
        reason: data.reason,
      });
      addToast({
        title: "Success",
        description: "Leave request created successfully",
        variant: "success",
      });
      router.push("/dashboard/leave");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header
              ?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to create leave request",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" onClick={() => router.push("/dashboard/leave")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Request Leave</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create a new leave request</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Leave Request Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Leave Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    id="leaveType"
                    {...register("leaveType")}
                    className={errors.leaveType ? "border-red-500" : ""}
                  >
                    <option value="annual">Annual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="maternity">Maternity Leave</option>
                    <option value="paternity">Paternity Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                  </Select>
                  {errors.leaveType && (
                    <p className="text-sm text-red-500 mt-1">{errors.leaveType.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register("startDate")}
                    className={errors.startDate ? "border-red-500" : ""}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-500 mt-1">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="endDate"
                    type="date"
                    min={startDate}
                    {...register("endDate")}
                    className={errors.endDate ? "border-red-500" : ""}
                  />
                  {errors.endDate && (
                    <p className="text-sm text-red-500 mt-1">{errors.endDate.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason
                  </label>
                  <Input
                    id="reason"
                    placeholder={t.leave.enterReason}
                    {...register("reason")}
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Button type="submit" isLoading={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Submit Request
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/leave")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

