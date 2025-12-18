import { apiClient, ApiResponse } from "../api-client";
import { User, MenuItem } from "../types";

export interface SignupRequest {
  email: string;
  password: string;
  phoneNumber?: string;
  role: string;
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
  signup: async (data: SignupRequest): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> => {
    const response = await apiClient.post<{ user: User; accessToken: string; refreshToken: string }>("/api/auth/signup", data);
    if (response.response.accessToken) {
      apiClient.setToken(response.response.accessToken);
      apiClient.setRefreshToken(response.response.refreshToken);
    }
    return response;
  },

  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post<LoginResponse>("/api/auth/login", data);
    if (response.response.accessToken) {
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

  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<User>> => {
    return apiClient.post("/api/auth/reset-password", { token, newPassword });
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> => {
    const response = await apiClient.post<RefreshTokenResponse>("/api/auth/refresh-token", { refreshToken });
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

  changePassword: async (data: ChangePasswordRequest): Promise<ApiResponse<null>> => {
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
};

