"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileCheck, Search, CheckCircle, Clock, FileText } from "lucide-react";
import { payrollApi } from "@/lib/api/payroll";
import { TaxDeclaration } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300",
    submitted: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    verified: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    rejected: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
  };
  return colors[status] || colors.draft;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function TaxDeclarationsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [declarations, setDeclarations] = useState<TaxDeclaration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDeclarations = useCallback(async () => {
    setIsLoading(true);
    try {
      // Note: API doesn't have a direct list endpoint, would need to fetch by employee or company
      // This is a placeholder - adjust based on your backend
      setDeclarations([]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch tax declarations",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDeclarations();
  }, [fetchDeclarations]);

  const handleSubmit = async (id: string) => {
    try {
      await payrollApi.submitTaxDeclaration(id);
      addToast({
        title: "Success",
        description: "Tax declaration submitted for verification",
        variant: "success",
      });
      fetchDeclarations();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to submit tax declaration",
        variant: "error",
      });
    }
  };

  const calculateTotalDeclared = (declarations: Record<string, Record<string, number>>): number => {
    let total = 0;
    Object.values(declarations).forEach((section) => {
      Object.values(section).forEach((amount) => {
        total += amount;
      });
    });
    return total;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tax Declarations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage employee tax-saving declarations and exemptions
          </p>
        </div>
        <Link href="/dashboard/payroll/tax-declarations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Declaration
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
                placeholder="Search tax declarations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchDeclarations}>Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : declarations.length > 0 ? (
            <div className="space-y-4">
              {declarations.map((declaration, index) => {
                const totalDeclared = calculateTotalDeclared(declaration.declarations);
                return (
                  <motion.div
                    key={declaration.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                          <FileCheck className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              Financial Year: {declaration.financialYear}
                            </h3>
                            <Badge className={getStatusColor(declaration.status)}>
                              {declaration.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-2">
                            {Object.entries(declaration.declarations).map(([section, items]) => {
                              const sectionTotal = Object.values(items).reduce((sum, val) => sum + val, 0);
                              return (
                                <div key={section}>
                                  <span className="text-gray-500 dark:text-gray-400 capitalize">
                                    {section.replace(/([A-Z])/g, " $1").trim()}:
                                  </span>
                                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {formatCurrency(sectionTotal)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Total Declared:</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(totalDeclared)}
                            </span>
                            {declaration.verifiedAmount && (
                              <>
                                <span className="text-gray-500 dark:text-gray-400">Verified:</span>
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(declaration.verifiedAmount)}
                                </span>
                              </>
                            )}
                          </div>
                          {declaration.notes && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                              Notes: {declaration.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      {declaration.status === "draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSubmit(declaration.id)}
                        >
                          Submit
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={FileCheck}
              title="No tax declarations found"
              description="Create tax declarations for employee tax-saving investments and exemptions"
              action={{
                label: "Create Declaration",
                onClick: () => router.push("/dashboard/payroll/tax-declarations/new"),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

