import { apiClient, ApiResponse } from "../api-client";
import {
  Attendance,
  CreateAttendanceRequest,
  UpdateAttendanceRequest,
  CheckInRequest,
  CheckOutRequest,
  GetAttendanceByEmployeeParams,
  GetAttendanceByCompanyParams,
  GetAttendanceStatsParams,
  AttendanceStats,
  SearchAttendancesParams,
} from "../types";

export const attendanceApi = {
  createAttendance: async (data: CreateAttendanceRequest): Promise<ApiResponse<Attendance>> => {
    return apiClient.post("/api/attendance", data);
  },

  getAttendance: async (id: string, companyId?: string): Promise<ApiResponse<Attendance>> => {
    const queryParams = companyId ? `?companyId=${companyId}` : "";
    return apiClient.get(`/api/attendance/${id}${queryParams}`);
  },

  updateAttendance: async (
    id: string,
    data: UpdateAttendanceRequest,
    companyId?: string
  ): Promise<ApiResponse<Attendance>> => {
    const queryParams = companyId ? `?companyId=${companyId}` : "";
    return apiClient.put(`/api/attendance/${id}${queryParams}`, data);
  },

  deleteAttendance: async (id: string, companyId?: string): Promise<ApiResponse<null>> => {
    const queryParams = companyId ? `?companyId=${companyId}` : "";
    return apiClient.delete(`/api/attendance/${id}${queryParams}`);
  },

  checkIn: async (
    employeeId: string,
    companyId: string,
    data?: CheckInRequest
  ): Promise<ApiResponse<Attendance>> => {
    return apiClient.post(`/api/attendance/checkin/${employeeId}/${companyId}`, data || {});
  },

  checkOut: async (
    employeeId: string,
    companyId: string,
    data?: CheckOutRequest
  ): Promise<ApiResponse<Attendance>> => {
    return apiClient.post(`/api/attendance/checkout/${employeeId}/${companyId}`, data || {});
  },

  getAttendanceByEmployee: async (
    employeeId: string,
    params?: GetAttendanceByEmployeeParams
  ): Promise<ApiResponse<Attendance[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.companyId) queryParams.append("companyId", params.companyId);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const queryString = queryParams.toString();
    return apiClient.get(`/api/attendance/employee/${employeeId}${queryString ? `?${queryString}` : ""}`);
  },

  getAttendanceByCompany: async (
    companyId: string,
    params?: GetAttendanceByCompanyParams
  ): Promise<ApiResponse<Attendance[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.status) queryParams.append("status", params.status);

    const queryString = queryParams.toString();
    return apiClient.get(`/api/attendance/company/${companyId}${queryString ? `?${queryString}` : ""}`);
  },

  getAttendanceStats: async (
    employeeId: string,
    companyId: string,
    params: GetAttendanceStatsParams
  ): Promise<ApiResponse<AttendanceStats>> => {
    const queryParams = new URLSearchParams();
    queryParams.append("month", params.month.toString());
    queryParams.append("year", params.year.toString());

    return apiClient.get(`/api/attendance/stats/${employeeId}/${companyId}?${queryParams.toString()}`);
  },

  searchAttendances: async (params?: SearchAttendancesParams): Promise<ApiResponse<Attendance[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.companyId) queryParams.append("companyId", params.companyId);
    if (params?.employeeId) queryParams.append("employeeId", params.employeeId);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    return apiClient.get(`/api/attendance/search${queryString ? `?${queryString}` : ""}`);
  },
};

