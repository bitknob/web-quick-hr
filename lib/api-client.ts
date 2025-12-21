import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9400";
const API_LOG_ENABLED = process.env.NEXT_PUBLIC_API_LOG_ENABLED === "true" || process.env.NEXT_PUBLIC_API_LOG_ENABLED === "1";

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
      (response) => {
        this.logResponse(response);
        return response;
      },
      async (error: AxiosError<ApiError>) => {
        if (error.config) {
          this.logErrorResponse(error);
        }
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

  private generateCurlCommand(config: InternalAxiosRequestConfig): string {
    const method = (config.method || "GET").toUpperCase();
    const url = config.url ? `${API_BASE_URL}${config.url}` : "";
    const headers: string[] = [];
    
    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        if (value && typeof value === "string" && key !== "Content-Length") {
          headers.push(`-H "${key}: ${value}"`);
        }
      });
    }

    let curlCommand = `curl -X ${method} "${url}"`;
    
    if (headers.length > 0) {
      curlCommand += ` \\\n  ${headers.join(" \\\n  ")}`;
    }

    if (config.data && method !== "GET" && method !== "DELETE") {
      const dataStr = typeof config.data === "string" 
        ? config.data 
        : JSON.stringify(config.data, null, 2);
      curlCommand += ` \\\n  -d '${dataStr.replace(/'/g, "'\\''")}'`;
    }

    return curlCommand;
  }

  private logResponse(response: AxiosResponse<unknown>): void {
    if (!API_LOG_ENABLED) return;
    
    const config = response.config as InternalAxiosRequestConfig;
    const curlCommand = this.generateCurlCommand(config);
    
    // Always log to terminal (works in both server and client via console.log)
    const logData = {
      type: "API Response",
      method: config.method?.toUpperCase(),
      url: `${API_BASE_URL}${config.url}`,
      curlCommand,
      request: {
        method: config.method?.toUpperCase(),
        url: `${API_BASE_URL}${config.url}`,
        headers: config.headers,
        data: config.data,
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
      },
    };
    
    // Terminal logging (plain text format)
    console.log("\n" + "=".repeat(80));
    console.log(`API Response: ${config.method?.toUpperCase()} ${config.url}`);
    console.log("=".repeat(80));
    console.log("\ncURL Command:");
    console.log(curlCommand);
    console.log("\nRequest Details:");
    console.log(JSON.stringify(logData.request, null, 2));
    console.log("\nResponse Details:");
    console.log(JSON.stringify(logData.response, null, 2));
    console.log("=".repeat(80) + "\n");
    
    // Browser console logging (only if in browser)
    if (typeof window !== "undefined") {
      console.group(`%cAPI Response: ${config.method?.toUpperCase()} ${config.url}`, "color: #10b981; font-weight: bold");
      console.log("%ccURL Command:", "color: #3b82f6; font-weight: bold");
      console.log(curlCommand);
      console.log("%cRequest Details:", "color: #f59e0b; font-weight: bold");
      console.log(logData.request);
      console.log("%cResponse Details:", "color: #10b981; font-weight: bold");
      console.log(logData.response);
      console.groupEnd();
    }
  }

  private logErrorResponse(error: AxiosError<ApiError>): void {
    const config = error.config as InternalAxiosRequestConfig;
    if (!config) return;
    
    // Check if it's a network error (no response)
    const isNetworkError = !error.response && error.message === "Network Error";
    
    if (isNetworkError) {
      // Always log network errors (they're important to know about)
      console.warn(
        `\n⚠️  Network Error: Cannot connect to API server at ${API_BASE_URL}${config.url}\n` +
        `Make sure the API server is running and accessible.\n`
      );
      return;
    }
    
    if (!API_LOG_ENABLED) return;
    
    const curlCommand = this.generateCurlCommand(config);
    
    // Always log to terminal (works in both server and client via console.log)
    const logData = {
      type: "API Error",
      method: config.method?.toUpperCase(),
      url: `${API_BASE_URL}${config.url}`,
      curlCommand,
      request: {
        method: config.method?.toUpperCase(),
        url: `${API_BASE_URL}${config.url}`,
        headers: config.headers,
        data: config.data,
      },
      error: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        data: error.response?.data,
        message: error.message,
      },
    };
    
    // Terminal logging (plain text format)
    console.log("\n" + "=".repeat(80));
    console.log(`API Error: ${config.method?.toUpperCase()} ${config.url}`);
    console.log("=".repeat(80));
    console.log("\ncURL Command:");
    console.log(curlCommand);
    console.log("\nRequest Details:");
    console.log(JSON.stringify(logData.request, null, 2));
    console.log("\nError Details:");
    console.log(JSON.stringify(logData.error, null, 2));
    console.log("=".repeat(80) + "\n");
    
    // Browser console logging (only if in browser)
    if (typeof window !== "undefined") {
      console.group(`%cAPI Error: ${config.method?.toUpperCase()} ${config.url}`, "color: #ef4444; font-weight: bold");
      console.log("%ccURL Command:", "color: #3b82f6; font-weight: bold");
      console.log(curlCommand);
      console.log("%cRequest Details:", "color: #f59e0b; font-weight: bold");
      console.log(logData.request);
      console.log("%cError Details:", "color: #ef4444; font-weight: bold");
      console.log(logData.error);
      console.groupEnd();
    }
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

  async get<T>(url: string, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  async postFormData<T>(url: string, formData: FormData, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
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

