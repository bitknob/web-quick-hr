import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9400";

export interface ApiResponse<T> {
  header: {
    responseCode: number;
    responseMessage: string;
    responseDetail: string;
  };
  response: T;
}

export interface ApiError {
  header: {
    responseCode: number;
    responseMessage: string;
    responseDetail: string;
  };
  response: null;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        // Only handle 401 (Unauthorized) errors for authentication
        // All other errors (400, 404, 500, etc.) should be handled by components
        // without causing any page refresh or navigation
        if (error.response?.status === 401 && typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          // Only redirect if not already on authentication-related pages
          // This prevents redirect loops and unnecessary page refreshes
          const isAuthPage = currentPath.includes("/login") || 
                            currentPath.includes("/signup") || 
                            currentPath.includes("/forgot-password") ||
                            currentPath.includes("/reset-password");
          
          if (!isAuthPage) {
            this.clearToken();
            // Use window.location.href for 401 errors as they indicate auth is required
            // Components should handle this gracefully
            window.location.href = "/login";
          }
        }
        // For all other errors, reject the promise so components can handle them
        // This prevents any page refresh - errors are caught in try/catch blocks
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }

  private clearToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  }

  setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", token);
    }
  }

  setRefreshToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("refreshToken", token);
    }
  }

  async get<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  async postFormData<T>(url: string, formData: FormData, config?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();

