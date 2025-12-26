import { apiClient, ApiResponse } from "../api-client";
import {
  Leave,
  CreateLeaveRequest,
  UpdateLeaveRequest,
  GetLeavesByEmployeeParams,
  GetLeavesByCompanyParams,
  SearchLeavesParams,
} from "../types";

export const leavesApi = {
  createLeave: async (data: CreateLeaveRequest): Promise<ApiResponse<Leave>> => {
    return apiClient.post("/api/leaves", data);
  },

  getLeave: async (id: string, companyId?: string): Promise<ApiResponse<Leave>> => {
    const queryParams = companyId ? `?companyId=${companyId}` : "";
    return apiClient.get(`/api/leaves/${id}${queryParams}`);
  },

  updateLeave: async (
    id: string,
    data: UpdateLeaveRequest,
    companyId?: string
  ): Promise<ApiResponse<Leave>> => {
    const queryParams = companyId ? `?companyId=${companyId}` : "";
    return apiClient.put(`/api/leaves/${id}${queryParams}`, data);
  },

  deleteLeave: async (id: string, companyId?: string): Promise<ApiResponse<null>> => {
    const queryParams = companyId ? `?companyId=${companyId}` : "";
    return apiClient.delete(`/api/leaves/${id}${queryParams}`);
  },

  cancelLeave: async (id: string, companyId?: string): Promise<ApiResponse<Leave>> => {
    const queryParams = companyId ? `?companyId=${companyId}` : "";
    return apiClient.post(`/api/leaves/${id}/cancel${queryParams}`, {});
  },

  approveLeave: async (id: string, companyId?: string): Promise<ApiResponse<Leave>> => {
    const queryParams = companyId ? `?companyId=${companyId}` : "";
    return apiClient.post(`/api/leaves/${id}/approve${queryParams}`, {});
  },

  rejectLeave: async (id: string, companyId?: string): Promise<ApiResponse<Leave>> => {
    const queryParams = companyId ? `?companyId=${companyId}` : "";
    return apiClient.post(`/api/leaves/${id}/reject${queryParams}`, {});
  },

  getLeavesByEmployee: async (
    employeeId: string,
    params?: GetLeavesByEmployeeParams
  ): Promise<ApiResponse<Leave[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.companyId) queryParams.append("companyId", params.companyId);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.status) queryParams.append("status", params.status);

    const queryString = queryParams.toString();
    return apiClient.get(`/api/leaves/employee/${employeeId}${queryString ? `?${queryString}` : ""}`);
  },

  getLeavesByCompany: async (
    companyId: string,
    params?: GetLeavesByCompanyParams
  ): Promise<ApiResponse<Leave[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.leaveType) queryParams.append("leaveType", params.leaveType);

    const queryString = queryParams.toString();
    return apiClient.get(`/api/leaves/company/${companyId}${queryString ? `?${queryString}` : ""}`);
  },

  getPendingLeaves: async (companyId?: string): Promise<ApiResponse<Leave[]>> => {
    const queryParams = companyId ? `?companyId=${companyId}` : "";
    return apiClient.get(`/api/leaves/pending${queryParams}`);
  },

  searchLeaves: async (params?: SearchLeavesParams): Promise<ApiResponse<Leave[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.companyId) queryParams.append("companyId", params.companyId);
    if (params?.employeeId) queryParams.append("employeeId", params.employeeId);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.leaveType) queryParams.append("leaveType", params.leaveType);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    return apiClient.get(`/api/leaves/search${queryString ? `?${queryString}` : ""}`);
  },
};

