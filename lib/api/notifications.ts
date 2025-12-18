import { apiClient, ApiResponse } from "../api-client";
import { Notification } from "../types";

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  read?: boolean;
}

export const notificationsApi = {
  getNotifications: async (params?: GetNotificationsParams): Promise<ApiResponse<Notification[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.read !== undefined) queryParams.append("read", params.read.toString());

    const queryString = queryParams.toString();
    return apiClient.get(`/api/notifications${queryString ? `?${queryString}` : ""}`);
  },

  markAsRead: async (id: string): Promise<ApiResponse<Notification>> => {
    return apiClient.put(`/api/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<ApiResponse<null>> => {
    return apiClient.put("/api/notifications/read-all");
  },

  deleteNotification: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/api/notifications/${id}`);
  },
};

