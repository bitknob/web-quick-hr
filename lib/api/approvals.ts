import { apiClient, ApiResponse } from "../api-client";
import { ApprovalRequest, ApprovalStatus, ApprovalRequestType } from "../types";

export interface CreateApprovalRequest {
  requestType: ApprovalRequestType;
  entityType: string;
  entityId: string;
  requestedFor: string;
  requestData: Record<string, any>;
  priority?: "low" | "normal" | "high" | "urgent";
  expiresAt?: string;
  approvers: Array<{
    approverType: string;
    isRequired: boolean;
  }>;
}

export interface GetApprovalsParams {
  page?: number;
  limit?: number;
  requestType?: ApprovalRequestType;
  status?: ApprovalStatus;
  requestedBy?: string;
  requestedFor?: string;
}

export interface ApproveRequest {
  comments?: string;
}

export interface RejectRequest {
  rejectionReason: string;
  comments?: string;
}

export interface CancelRequest {
  reason: string;
}

export const approvalsApi = {
  createApproval: async (data: CreateApprovalRequest): Promise<ApiResponse<ApprovalRequest>> => {
    return apiClient.post("/api/approvals", data);
  },

  getApproval: async (id: string): Promise<ApiResponse<ApprovalRequest>> => {
    return apiClient.get(`/api/approvals/${id}`);
  },

  getApprovals: async (params?: GetApprovalsParams): Promise<ApiResponse<ApprovalRequest[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.requestType) queryParams.append("requestType", params.requestType);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.requestedBy) queryParams.append("requestedBy", params.requestedBy);
    if (params?.requestedFor) queryParams.append("requestedFor", params.requestedFor);

    return apiClient.get(`/api/approvals?${queryParams.toString()}`);
  },

  getPendingApprovals: async (): Promise<ApiResponse<ApprovalRequest[]>> => {
    return apiClient.get("/api/approvals/pending");
  },

  approveRequest: async (id: string, data?: ApproveRequest): Promise<ApiResponse<ApprovalRequest>> => {
    return apiClient.post(`/api/approvals/${id}/approve`, data || {});
  },

  rejectRequest: async (id: string, data: RejectRequest): Promise<ApiResponse<ApprovalRequest>> => {
    return apiClient.post(`/api/approvals/${id}/reject`, data);
  },

  cancelRequest: async (id: string, data: CancelRequest): Promise<ApiResponse<ApprovalRequest>> => {
    return apiClient.post(`/api/approvals/${id}/cancel`, data);
  },
};

