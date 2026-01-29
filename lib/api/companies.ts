import { apiClient, ApiResponse } from "../api-client";
import { Company } from "../types";

export interface CreateCompanyRequest {
  name: string;
  code: string;
  description?: string;
  hrbpId?: string;
  subscriptionStatus?: "trial" | "active" | "inactive" | "expired";
  subscriptionEndsAt?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  code?: string;
  description?: string;
  hrbpId?: string;
  status?: "active" | "inactive";
  subscriptionStatus?: "trial" | "active" | "inactive" | "expired";
  subscriptionEndsAt?: string;
}

export interface CompanyProfileImageResponse {
  id: string;
  name: string;
  profileImageUrl: string;
}

export interface SearchCompaniesParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  status?: "active" | "inactive";
  subscriptionStatus?: "trial" | "active" | "inactive" | "expired";
}

export const companiesApi = {
  getCompanies: async (params?: SearchCompaniesParams): Promise<ApiResponse<Company[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.searchTerm) queryParams.append("searchTerm", params.searchTerm);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.subscriptionStatus) queryParams.append("subscriptionStatus", params.subscriptionStatus);

    const queryString = queryParams.toString();
    return apiClient.get(`/companies${queryString ? `?${queryString}` : ""}`);
  },

  getCompany: async (id: string): Promise<ApiResponse<Company>> => {
    return apiClient.get(`/companies/${id}`);
  },

  createCompany: async (data: CreateCompanyRequest): Promise<ApiResponse<Company>> => {
    return apiClient.post("/companies", data);
  },

  updateCompany: async (id: string, data: UpdateCompanyRequest): Promise<ApiResponse<Company>> => {
    return apiClient.put(`/companies/${id}`, data);
  },

  deleteCompany: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/companies/${id}`);
  },

  uploadProfileImage: async (companyId: string, imageFile: File): Promise<ApiResponse<CompanyProfileImageResponse>> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return apiClient.postFormData(`/companies/${companyId}/upload-profile-image`, formData);
  },

  // Helper method to validate company data
  validateCompanyData: (data: CreateCompanyRequest | UpdateCompanyRequest): string[] => {
    const errors: string[] = [];
    
    if ('name' in data && data.name && data.name.trim().length === 0) {
      errors.push('Company name is required');
    }
    
    if ('code' in data && data.code && data.code.trim().length === 0) {
      errors.push('Company code is required');
    }
    
    if ('code' in data && data.code && !/^[A-Z0-9]{3,}$/.test(data.code)) {
      errors.push('Company code must be at least 3 characters and contain only uppercase letters and numbers');
    }
    
    if ('subscriptionStatus' in data && data.subscriptionStatus && 
        !['trial', 'active', 'inactive', 'expired'].includes(data.subscriptionStatus)) {
      errors.push('Invalid subscription status');
    }
    
    if ('status' in data && data.status && 
        !['active', 'inactive'].includes(data.status)) {
      errors.push('Invalid company status');
    }
    
    return errors;
  },

  // Helper method to format subscription status
  formatSubscriptionStatus: (status?: string): string => {
    switch (status) {
      case 'trial':
        return 'Trial';
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  },

  // Helper method to get subscription status color
  getSubscriptionStatusColor: (status?: string): string => {
    switch (status) {
      case 'trial':
        return 'text-blue-600 bg-blue-100';
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'inactive':
        return 'text-gray-600 bg-gray-100';
      case 'expired':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  },

  // Helper method to check if subscription is expiring soon
  isSubscriptionExpiringSoon: (subscriptionEndsAt?: string): boolean => {
    if (!subscriptionEndsAt) return false;
    
    const endDate = new Date(subscriptionEndsAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  },

  // Helper method to get days until subscription expires
  getDaysUntilExpiry: (subscriptionEndsAt?: string): number | null => {
    if (!subscriptionEndsAt) return null;
    
    const endDate = new Date(subscriptionEndsAt);
    const now = new Date();
    return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
};

