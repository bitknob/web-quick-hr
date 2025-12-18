import { apiClient, ApiResponse } from "../api-client";

export interface SearchResult {
  type: "employee" | "company" | "department" | "menu";
  id: string;
  title: string;
  subtitle: string;
  path: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  byType: {
    employees?: number;
    companies?: number;
    departments?: number;
    menus?: number;
  };
}

export interface SearchParams {
  q?: string;
  searchTerm?: string;
  limit?: number;
}

export const searchApi = {
  globalSearch: async (params: SearchParams): Promise<ApiResponse<SearchResponse>> => {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append("q", params.q);
    if (params.searchTerm) queryParams.append("searchTerm", params.searchTerm);
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    return apiClient.get<SearchResponse>(`/api/search${queryString ? `?${queryString}` : ""}`);
  },
};

