"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Settings, CheckCircle2, XCircle, TrendingUp, TrendingDown, Calendar, Building2 } from "lucide-react";
import { payrollApi } from "@/lib/api/payroll";
import { SalaryStructure, SalaryComponent } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";

export default function SalaryStructureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const [structure, setStructure] = useState<SalaryStructure | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchStructure(params.id as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchStructure = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await payrollApi.getSalaryStructure(id);
      setStructure(response.response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch salary structure",
        variant: "error",
      });
      router.push("/dashboard/payroll/salary-structures");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading salary structure...</p>
        </div>
      </div>
    );
  }

  if (!structure) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Salary structure not found</p>
        <Button onClick={() => router.push("/dashboard/payroll/salary-structures")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Salary Structures
        </Button>
      </div>
    );
  }

  const earnings = structure.components?.filter(c => c.componentType === "earning") || [];
  const deductions = structure.components?.filter(c => c.componentType === "deduction") || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCategoryLabel = (category: string) => {
    return category
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const ComponentRow = ({ component, index }: { component: SalaryComponent; index: number }) => (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {component.componentName}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {getCategoryLabel(component.componentCategory)}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge
          className={
            component.componentType === "earning"
              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
              : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
          }
        >
          {component.componentType === "earning" ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          {component.componentType.charAt(0).toUpperCase() + component.componentType.slice(1)}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {component.isPercentage ? (
            <>
              {component.value}%
              {component.percentageOf && (
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  of {component.percentageOf}
                </span>
              )}
            </>
          ) : (
            `₹${component.value.toLocaleString("en-IN")}`
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge
            className={
              component.isTaxable
                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300"
                : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
            }
          >
            {component.isTaxable ? "Taxable" : "Tax-free"}
          </Badge>
          {component.isStatutory && (
            <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
              Statutory
            </Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Priority: {component.priority}
        </div>
      </td>
      <td className="px-4 py-3">
        {component.isActive !== false ? (
          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        ) : (
          <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        )}
      </td>
    </motion.tr>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/dashboard/payroll/salary-structures")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {structure.name}
              </h1>
              <Badge
                className={
                  structure.isActive
                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
                }
              >
                {structure.isActive ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-1" />
                    Inactive
                  </>
                )}
              </Badge>
            </div>
            {structure.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">{structure.description}</p>
            )}
          </div>
        </div>
        <Button onClick={() => router.push(`/dashboard/payroll/salary-structures/${structure.id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </motion.div>

      {/* Structure Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Structure Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="h-4 w-4" />
                  Company ID
                </div>
                <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {structure.companyId}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  Earnings Components
                </div>
                <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {earnings.length}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <TrendingDown className="h-4 w-4" />
                  Deduction Components
                </div>
                <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {deductions.length}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <Settings className="h-4 w-4" />
                  Total Components
                </div>
                <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {structure.components?.length || 0}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="h-4 w-4" />
                  Created At
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(structure.createdAt)}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="h-4 w-4" />
                  Updated At
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(structure.updatedAt)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Earnings Components */}
      {earnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Earnings Components ({earnings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Component
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Type
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Value
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Tax & Statutory
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Priority
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings
                      .sort((a, b) => a.priority - b.priority)
                      .map((component, index) => (
                        <ComponentRow key={component.id || index} component={component} index={index} />
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Deduction Components */}
      {deductions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Deduction Components ({deductions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Component
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Type
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Value
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Tax & Statutory
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Priority
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {deductions
                      .sort((a, b) => a.priority - b.priority)
                      .map((component, index) => (
                        <ComponentRow key={component.id || index} component={component} index={index} />
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {(!structure.components || structure.components.length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="py-12 text-center">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Components
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                This salary structure does not have any components yet.
              </p>
              <Button onClick={() => router.push(`/dashboard/payroll/salary-structures/${structure.id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Add Components
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

