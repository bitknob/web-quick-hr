import { apiClient, ApiResponse } from "../api-client";
import { Employee } from "../types";

export interface CreateEmployeeRequest {
  userId: string;
  companyId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  jobTitle: string;
  department: string;
  managerId?: string;
  hireDate: string;
  salary?: number;
}

export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  jobTitle?: string;
  department?: string;
  managerId?: string;
  salary?: number;
}

export interface SearchEmployeesParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  department?: string;
  jobTitle?: string;
  status?: "active" | "inactive" | "terminated";
  companyId?: string;
}

export interface TransferEmployeeRequest {
  newManagerId: string;
}

export const employeesApi = {
  getCurrentEmployee: async (): Promise<ApiResponse<Employee>> => {
    return apiClient.get("/api/employees/me");
  },

  createEmployee: async (data: CreateEmployeeRequest): Promise<ApiResponse<Employee>> => {
    return apiClient.post("/api/employees", data);
  },

  getEmployee: async (id: string): Promise<ApiResponse<Employee>> => {
    return apiClient.get(`/api/employees/${id}`);
  },

  updateEmployee: async (id: string, data: UpdateEmployeeRequest): Promise<ApiResponse<Employee>> => {
    return apiClient.put(`/api/employees/${id}`, data);
  },

  deleteEmployee: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/api/employees/${id}`);
  },

  searchEmployees: async (params: SearchEmployeesParams): Promise<ApiResponse<Employee[]>> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.searchTerm) queryParams.append("searchTerm", params.searchTerm);
    if (params.department) queryParams.append("department", params.department);
    if (params.jobTitle) queryParams.append("jobTitle", params.jobTitle);
    if (params.status) queryParams.append("status", params.status);
    if (params.companyId) queryParams.append("companyId", params.companyId);

    return apiClient.get(`/api/employees/search?${queryParams.toString()}`);
  },

  getHierarchy: async (rootId?: string, companyId?: string): Promise<ApiResponse<any[]>> => {
    const queryParams = new URLSearchParams();
    if (rootId) queryParams.append("rootId", rootId);
    if (companyId) queryParams.append("companyId", companyId);

    return apiClient.get(`/api/employees/hierarchy?${queryParams.toString()}`);
  },

  getDirectReports: async (managerId: string): Promise<ApiResponse<Employee[]>> => {
    return apiClient.get(`/api/employees/manager/${managerId}/direct-reports`);
  },

  getSubordinates: async (managerId: string): Promise<ApiResponse<Employee[]>> => {
    return apiClient.get(`/api/employees/manager/${managerId}/subordinates`);
  },

  transferEmployee: async (id: string, data: TransferEmployeeRequest): Promise<ApiResponse<Employee>> => {
    return apiClient.put(`/api/employees/${id}/transfer`, data);
  },
};

