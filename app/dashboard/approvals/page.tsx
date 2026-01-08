'use client';

import { useEffect, useState } from 'react';
import { getApprovals } from '@/lib/api/approvals';
import { GetApprovalsParams, ApprovalRequestType } from '@/lib/types';
import ApprovalRequestCard from '@/components/approvals/ApprovalRequestCard';
import ApprovalFilters from '@/components/approvals/ApprovalFilters';

interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  type: ApprovalRequestType;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export default function ApprovalsPage({
  params,
}: {
  params: GetApprovalsParams;
}) {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'pending',
    requestType: params.requestType || 'all',
  });

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        setLoading(true);
        const requestTypeFilter = filters.requestType === 'all' 
          ? undefined 
          : (filters.requestType as ApprovalRequestType);
        
        const data = await getApprovals({
          status: filters.status,
          requestType: requestTypeFilter,
        });
        
        setApprovals(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch approvals');
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
      ...(newFilters.status && { status: newFilters.status }),
      ...(newFilters.requestType && { requestType: newFilters.requestType }),
    }));
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Approvals</h1>
      
      <ApprovalFilters onFilterChange={handleFilterChange} />
      
      <div className="mt-8">
        {approvals.length === 0 ? (
          <p className="text-gray-500">No approval requests found.</p>
        ) : (
          <div className="grid gap-4">
            {approvals.map((approval) => (
              <ApprovalRequestCard key={approval.id} approval={approval} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
