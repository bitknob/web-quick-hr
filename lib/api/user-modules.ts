import { apiClient, ApiResponse } from "../api-client";
import { UserModule } from "../types";

export interface AssignModuleRequest {
  userId: string;
  moduleKey: string;
  moduleName?: string;
}

export interface UpdateUserModuleRequest {
  moduleName?: string;
  isActive?: boolean;
}

export interface GetUserModulesParams {
  userId?: string;
  isActive?: boolean;
}

export interface ValidModuleKeysResponse {
  moduleKeys: string[];
  moduleNames: Record<string, string>;
}

export const userModulesApi = {
  assignModule: async (data: AssignModuleRequest): Promise<ApiResponse<UserModule>> => {
    return apiClient.post("/api/user-modules", data);
  },

  getUserModules: async (userId: string, isActive?: boolean): Promise<ApiResponse<UserModule[]>> => {
    const queryParams = new URLSearchParams();
    if (isActive !== undefined) queryParams.append("isActive", String(isActive));

    const queryString = queryParams.toString();
    return apiClient.get(`/api/user-modules/user/${userId}${queryString ? `?${queryString}` : ""}`);
  },

  getAllUserModules: async (params?: GetUserModulesParams): Promise<ApiResponse<UserModule[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append("userId", params.userId);
    if (params?.isActive !== undefined) queryParams.append("isActive", String(params.isActive));

    const queryString = queryParams.toString();
    return apiClient.get(`/api/user-modules${queryString ? `?${queryString}` : ""}`);
  },

  getUserModule: async (id: string): Promise<ApiResponse<UserModule>> => {
    return apiClient.get(`/api/user-modules/${id}`);
  },

  updateUserModule: async (id: string, data: UpdateUserModuleRequest): Promise<ApiResponse<UserModule>> => {
    return apiClient.put(`/api/user-modules/${id}`, data);
  },

  removeUserModule: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/api/user-modules/${id}`);
  },

  getValidModuleKeys: async (): Promise<ApiResponse<ValidModuleKeysResponse>> => {
    return apiClient.get("/api/user-modules/valid-keys");
  },
};

