"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search, Download, Eye, DollarSign } from "lucide-react";
import { payrollApi } from "@/lib/api/payroll";
import { Payslip } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const getMonthName = (month: number): string => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "";
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function PayslipsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  const fetchPayslips = useCallback(async () => {
    setIsLoading(true);
    try {
      // Note: If employeeId is provided, fetch by employee, otherwise fetch by company/payroll run
      // This is a placeholder - you may need to adjust based on your requirements
      if (employeeId) {
        const response = await payrollApi.getPayslipsByEmployee(employeeId, { page, limit: 20 });
        const data = response.response;
        setPayslips(data.data || []);
        setTotalPages(Math.ceil((data.total || 0) / (data.limit || 20)));
      } else {
        // Fetch all payslips for the company
        // You may need to create an endpoint for this or use a default employeeId
        setPayslips([]);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch payslips",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, page, addToast]);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  const handleDownloadPDF = async (payslipId: string) => {
    try {
      // This would trigger PDF generation
      // Implementation depends on your PDF generation setup
      addToast({
        title: "Info",
        description: "PDF download feature will be implemented",
        variant: "info",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to download payslip",
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Payslips</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage employee payslips
          </p>
        </div>
      </motion.div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search by employee ID or payslip number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchPayslips}>Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : payslips.length > 0 ? (
            <>
              <div className="space-y-4">
                {payslips.map((payslip, index) => (
                  <motion.div
                    key={payslip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                          <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {payslip.payslipNumber}
                            </h3>
                            <Badge
                              className={
                                payslip.status === "approved"
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                  : payslip.status === "locked"
                                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                              }
                            >
                              {payslip.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>
                              {getMonthName(payslip.month)} {payslip.year}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatCurrency(payslip.netSalary)}
                            </span>
                            <span>Gross: {formatCurrency(payslip.grossSalary)}</span>
                            <span>Deductions: {formatCurrency(payslip.totalDeductions)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/payroll/payslips/${payslip.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(payslip.id)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={FileText}
              title="No payslips found"
              description="Payslips will appear here once payroll runs are processed"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

