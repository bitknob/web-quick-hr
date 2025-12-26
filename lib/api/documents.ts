import { apiClient, ApiResponse } from "../api-client";
import {
  Document,
  UploadDocumentRequest,
  UpdateDocumentRequest,
  RejectDocumentRequest,
  GetDocumentsByEmployeeParams,
  GetDocumentsByCompanyParams,
  SearchDocumentsParams,
} from "../types";

export const documentsApi = {
  uploadDocument: async (data: UploadDocumentRequest): Promise<ApiResponse<Document>> => {
    const formData = new FormData();
    formData.append("document", data.document);
    formData.append("employeeId", data.employeeId);
    formData.append("companyId", data.companyId);
    formData.append("documentType", data.documentType);
    formData.append("documentName", data.documentName);
    if (data.expiryDate) {
      formData.append("expiryDate", data.expiryDate);
    }
    if (data.notes) {
      formData.append("notes", data.notes);
    }

    return apiClient.postFormData("/api/documents/upload", formData);
  },

  getDocument: async (id: string, companyId?: string): Promise<ApiResponse<Document>> => {
    const queryParams = companyId ? `?companyId=${companyId}` : "";
    return apiClient.get(`/api/documents/${id}${queryParams}`);
  },

  updateDocument: async (
    id: string,
    data: UpdateDocumentRequest,
    companyId?: string
  ): Promise<ApiResponse<Document>> => {
    const queryParams = companyId ? `?companyId=${companyId}` : "";
    return apiClient.put(`/api/documents/${id}${queryParams}`, data);
  },

  deleteDocument: async (id: string, companyId?: string): Promise<ApiResponse<null>> => {
    const queryParams = companyId ? `?companyId=${companyId}` : "";
    return apiClient.delete(`/api/documents/${id}${queryParams}`);
  },

  verifyDocument: async (id: string, companyId?: string): Promise<ApiResponse<Document>> => {
    const queryParams = companyId ? `?companyId=${companyId}` : "";
    return apiClient.post(`/api/documents/${id}/verify${queryParams}`, {});
  },

  rejectDocument: async (
    id: string,
    data: RejectDocumentRequest,
    companyId?: string
  ): Promise<ApiResponse<Document>> => {
    const queryParams = companyId ? `?companyId=${companyId}` : "";
    return apiClient.post(`/api/documents/${id}/reject${queryParams}`, data);
  },

  getDocumentsByEmployee: async (
    employeeId: string,
    params?: GetDocumentsByEmployeeParams
  ): Promise<ApiResponse<Document[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.companyId) queryParams.append("companyId", params.companyId);
    if (params?.documentType) queryParams.append("documentType", params.documentType);
    if (params?.status) queryParams.append("status", params.status);

    const queryString = queryParams.toString();
    return apiClient.get(`/api/documents/employee/${employeeId}${queryString ? `?${queryString}` : ""}`);
  },

  getDocumentsByCompany: async (
    companyId: string,
    params?: GetDocumentsByCompanyParams
  ): Promise<ApiResponse<Document[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.documentType) queryParams.append("documentType", params.documentType);
    if (params?.status) queryParams.append("status", params.status);

    const queryString = queryParams.toString();
    return apiClient.get(`/api/documents/company/${companyId}${queryString ? `?${queryString}` : ""}`);
  },

  getPendingDocuments: async (companyId: string): Promise<ApiResponse<Document[]>> => {
    return apiClient.get(`/api/documents/pending/${companyId}`);
  },

  searchDocuments: async (params?: SearchDocumentsParams): Promise<ApiResponse<Document[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.companyId) queryParams.append("companyId", params.companyId);
    if (params?.employeeId) queryParams.append("employeeId", params.employeeId);
    if (params?.documentType) queryParams.append("documentType", params.documentType);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    return apiClient.get(`/api/documents/search${queryString ? `?${queryString}` : ""}`);
  },
};

