import { apiClient, ApiResponse } from "../api-client";
import { User, MenuItem } from "../types";

export interface SignupRequest {
  email: string;
  password: string;
  phoneNumber?: string;
  role: string;
  // Extended fields for company creation
  companyEmail?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  department?: string;
  hireDate?: string;
}

export interface CreateUserForEmployeeRequest {
  email: string;
  phoneNumber?: string;
  role?: string;
  companyName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
  deviceType?: "ios" | "android" | "web" | "other";
  deviceName?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  fcmToken?: string;
  apnsToken?: string;
  isPrimary?: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  device?: {
    id: string;
    deviceId: string;
    deviceType: string;
    isPrimary: boolean;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  signup: async (
    data: SignupRequest,
  ): Promise<
    ApiResponse<{ user: User; accessToken: string; refreshToken: string }>
  > => {
    const response = await apiClient.post<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>("/api/auth/signup", data);
    if (response.response.accessToken) {
      apiClient.setToken(response.response.accessToken);
      apiClient.setRefreshToken(response.response.refreshToken);
    }
    return response;
  },

  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post<LoginResponse>(
      "/api/auth/login",
      data,
    );
    // Only set tokens if response contains them (successful login)
    // 401 response for auto-creation won't have tokens but apiClient format might wrap it.
    // However, apiClient generally throws for non-2xx unless configured otherwise.
    // If 401 is returned as success body (unlikely for standard REST) or if we need to catch it.
    if (response.response && response.response.accessToken) {
      apiClient.setToken(response.response.accessToken);
      apiClient.setRefreshToken(response.response.refreshToken);
    }
    return response;
  },

  verifyEmail: async (token: string): Promise<ApiResponse<User>> => {
    return apiClient.get(`/api/auth/verify-email?token=${token}`);
  },

  resendVerification: async (email: string): Promise<ApiResponse<null>> => {
    return apiClient.post("/api/auth/resend-verification", { email });
  },

  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    return apiClient.post("/api/auth/forgot-password", { email });
  },

  resetPassword: async (
    token: string,
    newPassword: string,
  ): Promise<ApiResponse<User>> => {
    return apiClient.post("/api/auth/reset-password", { token, newPassword });
  },

  refreshToken: async (
    refreshToken: string,
  ): Promise<ApiResponse<RefreshTokenResponse>> => {
    const response = await apiClient.post<RefreshTokenResponse>(
      "/api/auth/refresh-token",
      { refreshToken },
    );
    if (response.response.accessToken) {
      apiClient.setToken(response.response.accessToken);
      apiClient.setRefreshToken(response.response.refreshToken);
    }
    return response;
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return apiClient.get("/api/auth/me");
  },

  uploadProfileImage: async (image: File): Promise<ApiResponse<User>> => {
    const formData = new FormData();
    formData.append("image", image);
    return apiClient.postFormData("/api/auth/upload-profile-image", formData);
  },

  changePassword: async (
    data: ChangePasswordRequest,
  ): Promise<ApiResponse<null>> => {
    return apiClient.post("/api/auth/change-password", data);
  },

  getMenu: async (): Promise<ApiResponse<MenuItem[]>> => {
    return apiClient.get<MenuItem[]>("/api/auth/menu");
  },

  logout: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }
  },

  // Role Assignment APIs
  assignRole: async (
    userId: string,
    role: string,
  ): Promise<ApiResponse<User>> => {
    return apiClient.post("/api/auth/assign-role", { userId, role });
  },

  getUserRole: async (userId: string): Promise<ApiResponse<User>> => {
    return apiClient.get(`/api/auth/users/${userId}/role`);
  },

  getUserRoleByEmail: async (email: string): Promise<ApiResponse<User>> => {
    return apiClient.get(
      `/api/auth/users/email/${encodeURIComponent(email)}/role`,
    );
  },

  createUserForEmployee: async (
    data: CreateUserForEmployeeRequest,
  ): Promise<ApiResponse<{ user: User; temporaryPassword: string }>> => {
    return apiClient.post("/api/auth/create-user-for-employee", data);
  },

  resendCredentials: async (
    email: string,
    companyName: string,
  ): Promise<
    ApiResponse<{ temporaryPassword: string; mustChangePassword: boolean }>
  > => {
    return apiClient.post("/api/auth/resend-credentials", {
      email,
      companyName,
    });
  },
};
