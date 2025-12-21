"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Star, ChevronRight } from "lucide-react";
import { payrollApi } from "@/lib/api/payroll";
import { PayslipTemplate } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    simple: "Simple",
    detailed: "Detailed",
    custom: "Custom",
  };
  return labels[type] || type;
};

const getStatusColor = (status?: string): string => {
  if (!status) return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
  const colors: Record<string, string> = {
    draft: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300",
    active: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    inactive: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
  };
  return colors[status] || colors.draft;
};

export default function PayslipTemplatesPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [templates, setTemplates] = useState<PayslipTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const companyId = "placeholder"; // Replace with actual companyId
      const response = await payrollApi.getPayslipTemplatesByCompany(companyId);
      setTemplates(response.response || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch payslip templates",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSetDefault = async (id: string) => {
    try {
      const companyId = "placeholder"; // Replace with actual companyId
      await payrollApi.setDefaultTemplate(id, { companyId });
      addToast({
        title: "Success",
        description: "Default template set successfully",
        variant: "success",
      });
      fetchTemplates();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to set default template",
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Payslip Templates</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Customize payslip appearance and content
          </p>
        </div>
        <Link href="/dashboard/payroll/payslip-templates/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </Link>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Payslip Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : templates.length > 0 ? (
            <div className="space-y-4">
              {templates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/dashboard/payroll/payslip-templates/${template.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {template.templateName}
                          </h3>
                          {template.isDefault && (
                            <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                          <Badge className={getStatusColor(template.status)}>
                            {template.status || "active"}
                          </Badge>
                          <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {getTypeLabel(template.templateType)}
                          </Badge>
                        </div>
                        {template.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {template.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            Created: {new Date(template.createdAt).toLocaleDateString()}
                          </span>
                          {template.updatedAt && (
                            <span>
                              Updated: {new Date(template.updatedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!template.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSetDefault(template.id);
                            }}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Set Default
                          </Button>
                        )}
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No payslip templates found"
              description="Create a payslip template to customize the appearance of generated payslips"
              action={{
                label: "Create Template",
                onClick: () => router.push("/dashboard/payroll/payslip-templates/new"),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

