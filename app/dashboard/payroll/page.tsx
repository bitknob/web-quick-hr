"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, FileText, Settings, Calendar, Users, CheckCircle, Info, ChevronDown, ChevronUp } from "lucide-react";
import { payrollApi } from "@/lib/api/payroll";
import { PayrollRun } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300",
    processing: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    completed: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    locked: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
    failed: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
  };
  return colors[status] || colors.draft;
};

const getMonthName = (month: number): string => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "";
};

export default function PayrollPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalRuns: 0,
    completedRuns: 0,
    processingRuns: 0,
    totalEmployees: 0,
  });

  const fetchPayrollData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Note: This assumes you have a companyId available
      // You may need to get this from context or user profile
      const companyId = "placeholder"; // Replace with actual companyId from context
      
      const response = await payrollApi.getPayrollRunsByCompany(companyId, { limit: 10 });
      const runs = response.response.data || [];
      setPayrollRuns(runs);

      const completed = runs.filter((r) => r.status === "completed").length;
      const processing = runs.filter((r) => r.status === "processing").length;
      const totalEmployees = runs.reduce((sum, r) => sum + r.totalEmployees, 0);

      setStats({
        totalRuns: runs.length,
        completedRuns: completed,
        processingRuns: processing,
        totalEmployees,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch payroll data",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

  const toggleExplanation = (key: string) => {
    setExpandedExplanations((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const calculationExplanations = {
    salaryStructure: {
      title: "Salary Structure Calculations",
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Component Types:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
              <li><strong>Earnings:</strong> Components that add to gross salary (Basic, HRA, Allowances, Bonus)</li>
              <li><strong>Deductions:</strong> Components that reduce gross salary (Taxes, PF, Insurance, Loans)</li>
            </ul>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Value Calculation:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
              <li><strong>Percentage:</strong> Calculated as % of base (e.g., Basic = 40% of CTC)</li>
              <li><strong>Fixed Amount:</strong> Constant value regardless of salary</li>
              <li><strong>Priority:</strong> Order of calculation (lower number = calculated first)</li>
            </ul>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Tax & Statutory:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
              <li><strong>Taxable:</strong> Included in taxable income for TDS calculation</li>
              <li><strong>Statutory:</strong> Mandatory components (PF, ESI, Professional Tax)</li>
            </ul>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Formula:</strong>
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded mt-1 font-mono text-xs">
              Gross Salary = Sum of all Earnings<br/>
              Total Deductions = Sum of all Deductions<br/>
              Net Salary = Gross Salary - Total Deductions
            </div>
          </div>
        </div>
      ),
    },
    taxConfiguration: {
      title: "Tax Configuration Calculations",
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Income Tax Slabs:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
              <li>Tax calculated based on income ranges with different rates</li>
              <li>Each slab has: From amount, To amount (null = no upper limit), Tax rate %</li>
              <li>Tax = Sum of (Taxable income in each slab × slab rate)</li>
            </ul>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Exemptions & Deductions:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
              <li><strong>Housing Allowance:</strong> % of Basic, Fixed, or Actual Rent (whichever is lower)</li>
              <li><strong>Travel Allowance:</strong> Actual Expense, Fixed Amount, or % of Basic</li>
              <li><strong>Standard Deduction:</strong> Fixed deduction from taxable income</li>
              <li><strong>Section Exemptions:</strong> 80C, 80D, 80G, 24 (up to specified limits)</li>
            </ul>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Statutory Deductions:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
              <li><strong>EPF/ESI:</strong> % of salary (employer + employee contributions)</li>
              <li><strong>Professional Tax:</strong> Slab-based fixed amount</li>
              <li><strong>Health Insurance:</strong> % of salary (if applicable)</li>
            </ul>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Tax Calculation:</strong>
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded mt-1 font-mono text-xs">
              Taxable Income = Gross Salary - Exemptions - Standard Deduction<br/>
              Income Tax = Apply tax slabs to Taxable Income<br/>
              Total Tax = Income Tax + Professional Tax
            </div>
          </div>
        </div>
      ),
    },
    variablePay: {
      title: "Variable Pay Calculations",
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Types:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
              <li><strong>Bonus:</strong> One-time or recurring performance bonus</li>
              <li><strong>Commission:</strong> Sales-based commission</li>
              <li><strong>Incentive:</strong> Performance-based incentive</li>
              <li><strong>Overtime:</strong> Additional payment for extra hours</li>
            </ul>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Taxation:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
              <li>Taxable variable pay is added to gross salary</li>
              <li>TDS calculated on total taxable income including variable pay</li>
              <li>Non-taxable variable pay excluded from tax calculations</li>
            </ul>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Application Period:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
              <li>Variable pay applied to specified payroll periods</li>
              <li>Recurring pay automatically included in subsequent periods</li>
            </ul>
          </div>
        </div>
      ),
    },
    arrears: {
      title: "Arrears Calculations",
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Arrears Types:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
              <li><strong>Salary Arrears:</strong> Backdated salary adjustments</li>
              <li><strong>Increment Arrears:</strong> Pending increment amount</li>
              <li><strong>Promotion Arrears:</strong> Salary difference due to promotion</li>
            </ul>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Calculation:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
              <li>Original Period: Period for which arrears are calculated</li>
              <li>Adjustment Amount: Difference between old and new salary</li>
              <li>Applied to: Payroll period when arrears are paid</li>
            </ul>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Tax Impact:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
              <li>Arrears added to current period gross salary</li>
              <li>Tax calculated on total including arrears</li>
              <li>May require tax recalculation for original period</li>
            </ul>
          </div>
        </div>
      ),
    },
    loans: {
      title: "Loan Deduction Calculations",
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-100">
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Loan Components:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
              <li><strong>Principal:</strong> Original loan amount</li>
              <li><strong>Interest Rate:</strong> Annual percentage rate (APR)</li>
              <li><strong>Tenure:</strong> Number of months for repayment</li>
            </ul>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-gray-100">EMI Calculation:</strong>
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded mt-1 font-mono text-xs">
              Monthly Interest Rate = (Annual Rate / 100) / 12<br/>
              EMI = Principal × [r(1+r)ⁿ] / [(1+r)ⁿ - 1]<br/>
              Where: r = monthly rate, n = tenure in months
            </div>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Deduction Period:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
              <li>EMI deducted monthly from salary until tenure completes</li>
              <li>Deduction starts from specified start date</li>
              <li>Deduction stops after tenure period or if paid early</li>
            </ul>
          </div>
        </div>
      ),
    },
    reimbursements: {
      title: "Reimbursement Calculations",
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Reimbursement Types:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
              <li><strong>Travel:</strong> Business travel expenses</li>
              <li><strong>Medical:</strong> Medical treatment expenses</li>
              <li><strong>Meal:</strong> Business meal expenses</li>
              <li><strong>Other:</strong> Miscellaneous business expenses</li>
            </ul>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Tax Treatment:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
              <li><strong>Taxable:</strong> Added to gross salary, subject to TDS</li>
              <li><strong>Tax-free:</strong> Excluded from taxable income (up to exemption limit)</li>
              <li>Exemption limit: Maximum amount exempt from tax (e.g., medical up to ₹15,000)</li>
            </ul>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Processing:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
              <li>Claim amount reimbursed in specified payroll period</li>
              <li>If taxable: Added to earnings, TDS calculated</li>
              <li>If tax-free: Added to earnings but excluded from taxable income</li>
            </ul>
          </div>
        </div>
      ),
    },
  };

  const statCards = [
    {
      title: "Total Payroll Runs",
      value: stats.totalRuns,
      icon: FileText,
      color: "bg-blue-600",
    },
    {
      title: "Completed Runs",
      value: stats.completedRuns,
      icon: CheckCircle,
      color: "bg-green-600",
    },
    {
      title: "Processing",
      value: stats.processingRuns,
      icon: Calendar,
      color: "bg-purple-600",
    },
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: Users,
      color: "bg-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Payroll Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage salary structures, process payroll, and generate payslips
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/payroll/runs/new">
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              New Payroll Run
            </Button>
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {isLoading ? "..." : stat.value}
                      </p>
                    </div>
                    <div
                      className={`h-14 w-14 rounded-xl ${stat.color} flex items-center justify-center shadow-sm`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Payroll Runs</CardTitle>
                <Link href="/dashboard/payroll/runs">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-gray-500">Loading...</p>
                </div>
              ) : payrollRuns.length > 0 ? (
                <div className="space-y-4">
                  {payrollRuns.map((run, index) => (
                    <motion.div
                      key={run.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <Link href={`/dashboard/payroll/runs/${run.id}`}>
                        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                {getMonthName(run.payrollMonth)} {run.payrollYear}
                              </h3>
                              <Badge className={getStatusColor(run.status)}>
                                {run.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>{run.totalEmployees} employees</span>
                              <span>Processed: {run.processedEmployees}</span>
                              {run.failedEmployees > 0 && (
                                <span className="text-red-600">Failed: {run.failedEmployees}</span>
                              )}
                            </div>
                          </div>
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No payroll runs found"
                  description="Create your first payroll run to get started"
                  action={{
                    label: "Create Payroll Run",
                    onClick: () => router.push("/dashboard/payroll/runs/new"),
                  }}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <Link 
                      href="/dashboard/payroll/salary-structures"
                      className="block cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Settings className="h-5 w-5 text-blue-600" />
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            Salary Structures
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage salary structure templates
                      </p>
                    </Link>
                    <button
                      onClick={() => toggleExplanation("salaryStructure")}
                      className="absolute top-4 right-4 p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded z-10"
                      type="button"
                    >
                      <Info className="h-4 w-4 text-blue-600" />
                    </button>
                  </motion.div>
                  <AnimatePresence>
                    {expandedExplanations.has("salaryStructure") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                      >
                        {calculationExplanations.salaryStructure.content}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                  >
                    <Link 
                      href="/dashboard/payroll/tax-configurations"
                      className="block cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-purple-600" />
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            Tax Configurations
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Configure tax settings by country
                      </p>
                    </Link>
                    <button
                      onClick={() => toggleExplanation("taxConfiguration")}
                      className="absolute top-4 right-4 p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded z-10"
                      type="button"
                    >
                      <Info className="h-4 w-4 text-purple-600" />
                    </button>
                  </motion.div>
                  <AnimatePresence>
                    {expandedExplanations.has("taxConfiguration") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg"
                      >
                        {calculationExplanations.taxConfiguration.content}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link href="/dashboard/payroll/payslips">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <p className="font-medium text-gray-900 dark:text-gray-100">Payslips</p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      View and manage payslips
                    </p>
                  </motion.div>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Additional Payroll Calculations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { key: "variablePay", label: "Variable Pay", color: "orange" },
                  { key: "arrears", label: "Arrears", color: "yellow" },
                  { key: "loans", label: "Loans", color: "red" },
                  { key: "reimbursements", label: "Reimbursements", color: "cyan" },
                ].map((item) => (
                  <div key={item.key}>
                    <button
                      onClick={() => toggleExplanation(item.key)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                        {expandedExplanations.has(item.key) ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedExplanations.has(item.key) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          {calculationExplanations[item.key as keyof typeof calculationExplanations]?.content}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

