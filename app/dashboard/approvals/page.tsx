"use client";

import { useEffect, useState, use } from "react";
import { approvalsApi, GetApprovalsParams } from "@/lib/api/approvals";
import { ApprovalRequest, ApprovalRequestType, ApprovalStatus } from "@/lib/types";
import ApprovalRequestCard from "@/components/approvals/ApprovalRequestCard";
import ApprovalFilters from "@/components/approvals/ApprovalFilters";

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
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px] text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Approvals</h1>
        <div className="text-sm text-gray-500">
          Showing {approvals.length} requests
        </div>
      </div>
      
      <ApprovalFilters onFilterChange={handleFilterChange} />
      
      <div className="mt-8">
        {approvals.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500">No approval requests found for the selected filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {approvals.map((approval) => (
              <ApprovalRequestCard key={approval.id} approval={approval} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

