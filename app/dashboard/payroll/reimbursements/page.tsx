"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Receipt, Search, CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { payrollApi } from "@/lib/api/payroll";
import { Reimbursement } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300",
    submitted: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    approved: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    rejected: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
    paid: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
  };
  return colors[status] || colors.draft;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "approved":
    case "paid":
      return CheckCircle;
    case "rejected":
      return XCircle;
    case "submitted":
      return Clock;
    default:
      return FileText;
  }
};

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    travel: "Travel",
    medical: "Medical",
    meal: "Meal",
    telephone: "Telephone",
    internet: "Internet",
    fuel: "Fuel",
    conveyance: "Conveyance",
    other: "Other",
  };
  return labels[type] || type;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getMonthName = (month: number): string => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "";
};

export default function ReimbursementsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchReimbursements = useCallback(async () => {
    setIsLoading(true);
    try {
      // Note: API doesn't have a direct list endpoint, would need to fetch by employee or company
      // This is a placeholder - adjust based on your backend
      setReimbursements([]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch reimbursements",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchReimbursements();
  }, [fetchReimbursements]);

  const handleSubmit = async (id: string) => {
    try {
      await payrollApi.submitReimbursement(id);
      addToast({
        title: "Success",
        description: "Reimbursement submitted for approval",
        variant: "success",
      });
      fetchReimbursements();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to submit reimbursement",
        variant: "error",
      });
    }
  };

  const handleApprove = async (id: string, claimAmount: number) => {
    try {
      await payrollApi.approveReimbursement(id, { approvedAmount: claimAmount });
      addToast({
        title: "Success",
        description: "Reimbursement approved successfully",
        variant: "success",
      });
      fetchReimbursements();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to approve reimbursement",
        variant: "error",
      });
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reimbursements</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage employee reimbursement claims
          </p>
        </div>
        <Link href="/dashboard/payroll/reimbursements/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Reimbursement
          </Button>
        </Link>
      </motion.div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search reimbursements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchReimbursements}>Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : reimbursements.length > 0 ? (
            <div className="space-y-4">
              {reimbursements.map((reimbursement, index) => {
                const StatusIcon = getStatusIcon(reimbursement.status);
                return (
                  <motion.div
                    key={reimbursement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20">
                          <StatusIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {getTypeLabel(reimbursement.reimbursementType)}
                            </h3>
                            <Badge className={getStatusColor(reimbursement.status)}>
                              {reimbursement.status}
                            </Badge>
                            {!reimbursement.isTaxable && (
                              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                Tax Exempt
                              </Badge>
                            )}
                          </div>
                          {reimbursement.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              {reimbursement.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              Claimed: {formatCurrency(reimbursement.claimAmount)}
                            </span>
                            {reimbursement.approvedAmount && (
                              <span className="font-semibold text-green-600">
                                Approved: {formatCurrency(reimbursement.approvedAmount)}
                              </span>
                            )}
                            <span>Date: {formatDate(reimbursement.claimDate)}</span>
                            <span>
                              Month: {getMonthName(reimbursement.applicableMonth)} {reimbursement.applicableYear}
                            </span>
                          </div>
                          {reimbursement.rejectionReason && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                              Rejection Reason: {reimbursement.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {reimbursement.status === "draft" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSubmit(reimbursement.id)}
                          >
                            Submit
                          </Button>
                        )}
                        {reimbursement.status === "submitted" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(reimbursement.id, reimbursement.claimAmount)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Receipt}
              title="No reimbursements found"
              description="Create reimbursement claims for employee expenses"
              action={{
                label: "Create Reimbursement",
                onClick: () => router.push("/dashboard/payroll/reimbursements/new"),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

