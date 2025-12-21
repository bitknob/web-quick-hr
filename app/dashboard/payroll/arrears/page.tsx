"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, DollarSign, Search, Calendar } from "lucide-react";
import { payrollApi } from "@/lib/api/payroll";
import { Arrears } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    salary_revision: "Salary Revision",
    promotion: "Promotion",
    retroactive_adjustment: "Retroactive Adjustment",
    correction: "Correction",
    bonus_arrears: "Bonus Arrears",
    allowance_adjustment: "Allowance Adjustment",
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

export default function ArrearsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [arrears, setArrears] = useState<Arrears[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchArrears = useCallback(async () => {
    setIsLoading(true);
    try {
      // Note: API doesn't have a direct list endpoint, would need to fetch by employee or company
      // This is a placeholder - adjust based on your backend
      setArrears([]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch arrears records",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchArrears();
  }, [fetchArrears]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Arrears</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage salary revisions, promotions, and retroactive adjustments
          </p>
        </div>
        <Link href="/dashboard/payroll/arrears/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Arrears
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
                placeholder="Search arrears records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchArrears}>Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : arrears.length > 0 ? (
            <div className="space-y-4">
              {arrears.map((arrear, index) => (
                <motion.div
                  key={arrear.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                        <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {getTypeLabel(arrear.arrearsType)}
                          </h3>
                          {arrear.isTaxable && (
                            <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                              Taxable
                            </Badge>
                          )}
                        </div>
                        {arrear.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {arrear.description}
                          </p>
                        )}
                        {arrear.reason && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Reason: {arrear.reason}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(arrear.adjustmentAmount)}
                          </span>
                          <span>
                            Period: {formatDate(arrear.originalPeriodFrom)} - {formatDate(arrear.originalPeriodTo)}
                          </span>
                          <span>
                            Applicable: {getMonthName(arrear.applicableMonth)} {arrear.applicableYear}
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
              icon={DollarSign}
              title="No arrears records found"
              description="Create arrears records for salary revisions, promotions, and retroactive adjustments"
              action={{
                label: "Create Arrears",
                onClick: () => router.push("/dashboard/payroll/arrears/new"),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

