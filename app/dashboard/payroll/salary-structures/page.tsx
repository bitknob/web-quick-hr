"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings, ChevronRight, Edit, Trash2 } from "lucide-react";
import { payrollApi } from "@/lib/api/payroll";
import { SalaryStructure } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function SalaryStructuresPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStructures = useCallback(async () => {
    setIsLoading(true);
    try {
      // Note: Replace with actual companyId from context
      const companyId = "placeholder";
      const response = await payrollApi.getSalaryStructuresByCompany(companyId);
      setStructures(response.response || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch salary structures",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Salary Structures
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage salary structure templates for your organization
          </p>
        </div>
        <Link href="/dashboard/payroll/salary-structures/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Structure
          </Button>
        </Link>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Salary Structures</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : structures.length > 0 ? (
            <div className="space-y-4">
              {structures.map((structure, index) => (
                <motion.div
                  key={structure.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/dashboard/payroll/salary-structures/${structure.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Settings className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {structure.name}
                          </h3>
                          <Badge
                            className={
                              structure.isActive
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
                            }
                          >
                            {structure.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {structure.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {structure.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            {structure.components?.length || 0} component
                            {(structure.components?.length || 0) !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Settings}
              title="No salary structures found"
              description="Create your first salary structure template to get started"
              action={{
                label: "Create Structure",
                onClick: () => router.push("/dashboard/payroll/salary-structures/new"),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

