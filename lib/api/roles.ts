import { apiClient, ApiResponse } from "../api-client";
import { Role } from "../types";

export interface CreateRoleRequest {
  roleKey: string;
  name: string;
  description?: string;
  hierarchyLevel: number;
  parentRoleId?: string;
  companyId?: string;
  permissions?: Record<string, unknown>;
  menuAccess?: string[];
  canAccessAllCompanies?: boolean;
  canAccessMultipleCompanies?: boolean;
  canAccessSingleCompany?: boolean;
  canManageCompanies?: boolean;
  canCreateCompanies?: boolean;
  canManageProviderStaff?: boolean;
  canManageEmployees?: boolean;
  canApproveLeaves?: boolean;
  canViewPayroll?: boolean;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  hierarchyLevel?: number;
  parentRoleId?: string;
  permissions?: Record<string, unknown>;
  menuAccess?: string[];
  canAccessAllCompanies?: boolean;
  canAccessMultipleCompanies?: boolean;
  canAccessSingleCompany?: boolean;
  canManageCompanies?: boolean;
  canCreateCompanies?: boolean;
  canManageProviderStaff?: boolean;
  canManageEmployees?: boolean;
  canApproveLeaves?: boolean;
  canViewPayroll?: boolean;
  isActive?: boolean;
}

export interface GetRolesParams {
  companyId?: string;
  isSystemRole?: boolean;
  isActive?: boolean;
  hierarchyLevel?: number;
}

export interface AssignMenuAccessRequest {
  menuIds: string[];
}

export interface UpdatePermissionsRequest {
  permissions: Record<string, unknown>;
}

export const rolesApi = {
  initializeSystemRoles: async (): Promise<ApiResponse<null>> => {
    return apiClient.get("/api/roles/initialize");
  },

  getRoles: async (params?: GetRolesParams): Promise<ApiResponse<Role[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.companyId) queryParams.append("companyId", params.companyId);
    if (params?.isSystemRole !== undefined) queryParams.append("isSystemRole", String(params.isSystemRole));
    if (params?.isActive !== undefined) queryParams.append("isActive", String(params.isActive));
    if (params?.hierarchyLevel !== undefined) queryParams.append("hierarchyLevel", String(params.hierarchyLevel));

    const queryString = queryParams.toString();
    return apiClient.get(`/api/roles${queryString ? `?${queryString}` : ""}`);
  },

  getRole: async (id: string): Promise<ApiResponse<Role>> => {
    return apiClient.get(`/api/roles/${id}`);
  },

  createRole: async (data: CreateRoleRequest): Promise<ApiResponse<Role>> => {
    return apiClient.post("/api/roles", data);
  },

  updateRole: async (id: string, data: UpdateRoleRequest): Promise<ApiResponse<Role>> => {
    return apiClient.put(`/api/roles/${id}`, data);
  },

  deleteRole: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/api/roles/${id}`);
  },

  getRoleHierarchy: async (id: string): Promise<ApiResponse<Role[]>> => {
    return apiClient.get(`/api/roles/${id}/hierarchy`);
  },

  getRolesByHierarchyLevel: async (level: number): Promise<ApiResponse<Role[]>> => {
    return apiClient.get(`/api/roles/hierarchy-level/${level}`);
  },

  getChildRoles: async (id: string): Promise<ApiResponse<Role[]>> => {
    return apiClient.get(`/api/roles/${id}/children`);
  },

  getParentRoles: async (id: string): Promise<ApiResponse<Role[]>> => {
    return apiClient.get(`/api/roles/${id}/parents`);
  },

  assignMenuAccess: async (id: string, data: AssignMenuAccessRequest): Promise<ApiResponse<Role>> => {
    return apiClient.post(`/api/roles/${id}/menu-access`, data);
  },

  updatePermissions: async (id: string, data: UpdatePermissionsRequest): Promise<ApiResponse<Role>> => {
    return apiClient.put(`/api/roles/${id}/permissions`, data);
  },

  getRoleHierarchyStructure: async (): Promise<ApiResponse<{ hierarchy: Array<{ level: number; roles: Role[] }> }>> => {
    return apiClient.get("/api/roles/hierarchy");
  },

  getHierarchyChildren: async (): Promise<ApiResponse<Role[]>> => {
    return apiClient.get("/api/roles/hierarchy/children");
  },

  getHierarchyParents: async (): Promise<ApiResponse<Role[]>> => {
    return apiClient.get("/api/roles/hierarchy/parents");
  },

  getCreateFormData: async (): Promise<ApiResponse<{
    hierarchyLevels: number[];
    parentRoles: Role[];
    defaults: {
      hierarchyLevel: number;
      isActive: boolean;
      permissions: Record<string, unknown>;
      menuAccess: string[];
      canAccessAllCompanies: boolean;
      canAccessMultipleCompanies: boolean;
      canAccessSingleCompany: boolean;
      canManageCompanies: boolean;
      canCreateCompanies: boolean;
      canManageProviderStaff: boolean;
      canManageEmployees: boolean;
      canApproveLeaves: boolean;
      canViewPayroll: boolean;
    };
  }>> => {
    return apiClient.get("/api/roles/create");
  },

  getCreateHierarchy: async (): Promise<ApiResponse<{ hierarchy: Array<{ level: number; roles: Role[] }> }>> => {
    return apiClient.get("/api/roles/create/hierarchy");
  },

  getCreateChildren: async (): Promise<ApiResponse<Role[]>> => {
    return apiClient.get("/api/roles/create/children");
  },

  getCreateParents: async (): Promise<ApiResponse<Role[]>> => {
    return apiClient.get("/api/roles/create/parents");
  },
};

