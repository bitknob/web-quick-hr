"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { approvalsApi, GetApprovalsParams } from "@/lib/api/approvals";
import { ApprovalRequest, ApprovalRequestType, ApprovalStatus } from "@/lib/types";
import ApprovalRequestCard from "@/components/approvals/ApprovalRequestCard";
import ApprovalFilters from "@/components/approvals/ApprovalFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Filter } from "lucide-react";
import { SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function ApprovalsPage({
  params: paramsPromise,
}: {
  params: Promise<{ requestType?: string }>;
}) {
  const params = use(paramsPromise);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "pending" as ApprovalStatus,
    requestType: (params.requestType || "all") as string,
  });

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        setLoading(true);
        const requestTypeFilter = filters.requestType === "all" 
          ? undefined 
          : (filters.requestType as ApprovalRequestType);
        
        const response = await approvalsApi.getApprovals({
          status: filters.status,
          requestType: requestTypeFilter,
        });
        
        // ApiResponse structure: { header: { responseCode, responseMessage }, response: T }
        setApprovals(response.response);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch approvals");
        setApprovals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovals();
  }, [filters]);

  const handleFilterChange = (newFilters: {
    status?: string;
    requestType?: string;
  }) => {
    setFilters((prev) => ({
      ...prev,
      ...(newFilters.status && { status: newFilters.status as ApprovalStatus }),
      ...(newFilters.requestType && { requestType: newFilters.requestType }),
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Approvals</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage approval requests</p>
          </div>
        </motion.div>
        <Card>
          <CardContent className="p-6">
            <SkeletonTable />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Approvals</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage approval requests</p>
          </div>
        </motion.div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <div className="text-red-500 text-lg font-medium">{error}</div>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Approvals</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage approval requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {approvals.length} requests
          </Badge>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </div>
            <ApprovalFilters onFilterChange={handleFilterChange} />
          </CardHeader>
          <CardContent>
            {approvals.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No approval requests found"
                description="No approval requests found for the selected filters."
                action={{
                  label: "Clear Filters",
                  onClick: () => setFilters({ status: "pending", requestType: "all" })
                }}
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {approvals.map((approval, index) => (
                  <motion.div
                    key={approval.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ApprovalRequestCard approval={approval} />
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

