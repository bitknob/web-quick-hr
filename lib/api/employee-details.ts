import { apiClient, ApiResponse } from "../api-client";
import {
  EmployeeDetails,
  CreateOrUpdateEmployeeDetailsRequest,
  UpdateEmployeeDetailsRequest,
} from "../types";

export const employeeDetailsApi = {
  createOrUpdateEmployeeDetails: async (
    employeeId: string,
    companyId: string,
    data: CreateOrUpdateEmployeeDetailsRequest
  ): Promise<ApiResponse<EmployeeDetails>> => {
    return apiClient.post(`/api/employee-details/${employeeId}/${companyId}`, data);
  },

  getEmployeeDetails: async (employeeId: string, companyId?: string): Promise<ApiResponse<EmployeeDetails>> => {
    const queryParams = companyId ? `?companyId=${companyId}` : "";
    return apiClient.get(`/api/employee-details/${employeeId}${queryParams}`);
  },

  updateEmployeeDetails: async (
    employeeId: string,
    companyId: string,
    data: UpdateEmployeeDetailsRequest
  ): Promise<ApiResponse<EmployeeDetails>> => {
    return apiClient.put(`/api/employee-details/${employeeId}/${companyId}`, data);
  },

  getEmployeeDetailsByCompany: async (companyId: string): Promise<ApiResponse<EmployeeDetails[]>> => {
    return apiClient.get(`/api/employee-details/company/${companyId}`);
  },
};

