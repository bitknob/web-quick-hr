"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, CreditCard, Search, CheckCircle, Clock } from "lucide-react";
import { payrollApi } from "@/lib/api/payroll";
import { Loan } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    personal_loan: "Personal Loan",
    advance_salary: "Salary Advance",
    home_loan: "Home Loan",
    vehicle_loan: "Vehicle Loan",
    education_loan: "Education Loan",
    medical_loan: "Medical Loan",
    other: "Other",
  };
  return labels[type] || type;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    completed: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    closed: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300",
  };
  return colors[status] || colors.active;
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

export default function LoansPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLoans = useCallback(async () => {
    setIsLoading(true);
    try {
      // Note: API doesn't have a direct list endpoint, would need to fetch by employee or company
      // This is a placeholder - adjust based on your backend
      setLoans([]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch loans",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Loans</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage employee loans and salary advances
          </p>
        </div>
        <Link href="/dashboard/payroll/loans/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Loan
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
                placeholder="Search loans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchLoans}>Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : loans.length > 0 ? (
            <div className="space-y-4">
              {loans.map((loan, index) => (
                <motion.div
                  key={loan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                        <CreditCard className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {loan.loanName}
                          </h3>
                          <Badge className={getStatusColor(loan.status)}>
                            {loan.status}
                          </Badge>
                          <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {getTypeLabel(loan.loanType)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Principal:</span>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(loan.principalAmount)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">EMI:</span>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(loan.emiAmount)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Remaining:</span>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(loan.remainingBalance)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Rate:</span>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {loan.interestRate}% p.a.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                          <span>Tenure: {loan.tenureMonths} months</span>
                          <span>Start Date: {formatDate(loan.startDate)}</span>
                          <span>
                            Deduction: {loan.deductionStartMonth}/{loan.deductionStartYear}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CreditCard}
              title="No loans found"
              description="Create loan records for employee loans and salary advances"
              action={{
                label: "Create Loan",
                onClick: () => router.push("/dashboard/payroll/loans/new"),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

