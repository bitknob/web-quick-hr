"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, DollarSign, Search, CheckCircle, Clock, XCircle } from "lucide-react";
import { payrollApi } from "@/lib/api/payroll";
import { VariablePay } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const getStatusColor = (isApproved: boolean): string => {
  return isApproved
    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
};

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    bonus: "Bonus",
    incentive: "Incentive",
    commission: "Commission",
    overtime: "Overtime",
    shift_allowance: "Shift Allowance",
    performance_bonus: "Performance Bonus",
    retention_bonus: "Retention Bonus",
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

const getMonthName = (month: number): string => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "";
};

export default function VariablePayPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [variablePays, setVariablePays] = useState<VariablePay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchVariablePays = useCallback(async () => {
    setIsLoading(true);
    try {
      // Note: API doesn't have a direct list endpoint, would need to fetch by employee or company
      // This is a placeholder - adjust based on your backend
      setVariablePays([]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch variable pay records",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchVariablePays();
  }, [fetchVariablePays]);

  const handleApprove = async (id: string) => {
    try {
      await payrollApi.approveVariablePay(id);
      addToast({
        title: "Success",
        description: "Variable pay approved successfully",
        variant: "success",
      });
      fetchVariablePays();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to approve variable pay",
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Variable Pay</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage bonuses, incentives, overtime, and other variable compensation
          </p>
        </div>
        <Link href="/dashboard/payroll/variable-pay/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Variable Pay
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
                placeholder="Search variable pay records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchVariablePays}>Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : variablePays.length > 0 ? (
            <div className="space-y-4">
              {variablePays.map((variablePay, index) => (
                <motion.div
                  key={variablePay.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {getTypeLabel(variablePay.variablePayType)}
                          </h3>
                          <Badge className={getStatusColor(variablePay.isApproved)}>
                            {variablePay.isApproved ? "Approved" : "Pending"}
                          </Badge>
                          {variablePay.isRecurring && (
                            <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                              Recurring
                            </Badge>
                          )}
                          {variablePay.isTaxable && (
                            <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                              Taxable
                            </Badge>
                          )}
                        </div>
                        {variablePay.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {variablePay.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(variablePay.amount)}
                          </span>
                          <span>
                            {getMonthName(variablePay.applicableMonth)} {variablePay.applicableYear}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!variablePay.isApproved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(variablePay.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={DollarSign}
              title="No variable pay records found"
              description="Create variable pay records for bonuses, incentives, and other variable compensation"
              action={{
                label: "Create Variable Pay",
                onClick: () => router.push("/dashboard/payroll/variable-pay/new"),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

