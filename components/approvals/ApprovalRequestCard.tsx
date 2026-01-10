"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApprovalRequest } from "@/lib/types";
import { format } from "date-fns";

interface ApprovalRequestCardProps {
  approval: ApprovalRequest;
}

export default function ApprovalRequestCard({ approval }: ApprovalRequestCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "pending":
        return "warning";
      case "cancelled":
      case "expired":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold">
            {approval.requestType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </CardTitle>
          <CardDescription>
            Requested by {approval.requestedBy}
          </CardDescription>
        </div>
        <Badge variant={getStatusVariant(approval.status)}>
          {approval.status.toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date:</span>
            <span>{format(new Date(approval.createdAt), "PPP")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Priority:</span>
            <span className="capitalize">{approval.priority}</span>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" className="w-full">View Details</Button>
            {approval.status === 'pending' && (
              <>
                <Button variant="default" size="sm" className="w-full bg-green-600 hover:bg-green-700">Approve</Button>
                <Button variant="error" size="sm" className="w-full">Reject</Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
