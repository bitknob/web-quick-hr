import { apiClient, ApiResponse } from "../api-client";
import { Company } from "../types";

export interface CreateCompanyRequest {
  name: string;
  code: string;
  description?: string;
  hrbpId?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  description?: string;
  hrbpId?: string;
  status?: "active" | "inactive";
}

export interface SearchCompaniesParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  status?: "active" | "inactive";
}

export const companiesApi = {
  getCompanies: async (params?: SearchCompaniesParams): Promise<ApiResponse<Company[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.searchTerm) queryParams.append("searchTerm", params.searchTerm);
    if (params?.status) queryParams.append("status", params.status);

    const queryString = queryParams.toString();
    return apiClient.get(`/api/companies${queryString ? `?${queryString}` : ""}`);
  },
  createCompany: async (data: CreateCompanyRequest): Promise<ApiResponse<Company>> => {
    return apiClient.post("/api/companies", data);
  },

  getCompany: async (id: string): Promise<ApiResponse<Company>> => {
    return apiClient.get(`/api/companies/${id}`);
  },

  updateCompany: async (id: string, data: UpdateCompanyRequest): Promise<ApiResponse<Company>> => {
    return apiClient.put(`/api/companies/${id}`, data);
  },

  deleteCompany: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/api/companies/${id}`);
  },

  uploadProfileImage: async (companyId: string, imageFile: File): Promise<ApiResponse<Company>> => {
    const formData = new FormData();
    formData.append("image", imageFile);
    return apiClient.postFormData(`/api/companies/${companyId}/upload-profile-image`, formData);
  },
};

