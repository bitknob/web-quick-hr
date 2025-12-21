"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, ChevronRight, MapPin } from "lucide-react";
import { payrollApi } from "@/lib/api/payroll";
import { TaxConfiguration } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function TaxConfigurationsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [configurations, setConfigurations] = useState<TaxConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfigurations = useCallback(async () => {
    setIsLoading(true);
    try {
      const companyId = "placeholder"; // Replace with actual companyId
      const response = await payrollApi.getTaxConfigurationsByCompany(companyId);
      setConfigurations(response.response || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } } ).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch tax configurations",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Tax Configurations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage country and region-specific tax settings
          </p>
        </div>
        <Link href="/dashboard/payroll/tax-configurations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Configuration
          </Button>
        </Link>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Tax Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : configurations.length > 0 ? (
            <div className="space-y-4">
              {configurations.map((config, index) => (
                <motion.div
                  key={config.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/dashboard/payroll/tax-configurations/${config.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                            <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {config.country}
                              {config.state && ` - ${config.state}`}
                              {config.province && ` - ${config.province}`}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Financial Year: {config.financialYear}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                          {config.incomeTaxEnabled && (
                            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                              Income Tax
                            </Badge>
                          )}
                          {config.socialSecurityEnabled && (
                            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              Social Security
                            </Badge>
                          )}
                          {config.healthInsuranceEnabled && (
                            <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                              Health Insurance
                            </Badge>
                          )}
                          {config.professionalTaxEnabled && (
                            <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                              Professional Tax
                            </Badge>
                          )}
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
              icon={DollarSign}
              title="No tax configurations found"
              description="Create a tax configuration to set up country-specific tax rules"
              action={{
                label: "Create Configuration",
                onClick: () => router.push("/dashboard/payroll/tax-configurations/new"),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

