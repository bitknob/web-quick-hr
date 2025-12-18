import { apiClient, ApiResponse } from "../api-client";
import { Department } from "../types";

export interface CreateDepartmentRequest {
  companyId: string;
  name: string;
  description?: string;
  headId?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  headId?: string;
}

export interface GetDepartmentsParams {
  companyId?: string;
}

export const departmentsApi = {
  getDepartments: async (params?: GetDepartmentsParams): Promise<ApiResponse<Department[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.companyId) queryParams.append("companyId", params.companyId);

    const queryString = queryParams.toString();
    return apiClient.get(`/api/departments${queryString ? `?${queryString}` : ""}`);
  },

  getDepartment: async (id: string): Promise<ApiResponse<Department>> => {
    return apiClient.get(`/api/departments/${id}`);
  },

  createDepartment: async (data: CreateDepartmentRequest): Promise<ApiResponse<Department>> => {
    return apiClient.post("/api/departments", data);
  },

  updateDepartment: async (id: string, data: UpdateDepartmentRequest): Promise<ApiResponse<Department>> => {
    return apiClient.put(`/api/departments/${id}`, data);
  },

  deleteDepartment: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/api/departments/${id}`);
  },
};

