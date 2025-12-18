export type UserRole =
  | "super_admin"
  | "provider_admin"
  | "provider_hr_staff"
  | "hrbp"
  | "company_admin"
  | "department_head"
  | "manager"
  | "employee";

export interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  isEmailVerified: boolean;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  userId: string;
  companyId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  jobTitle: string;
  department: string;
  managerId?: string;
  hireDate: string;
  salary?: number;
  status: "active" | "inactive";
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  description?: string;
  hrbpId?: string;
  profileImageUrl?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  headId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: string;
  userId: string;
  deviceId: string;
  deviceType: "ios" | "android" | "web" | "other";
  deviceName?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  fcmToken?: string;
  apnsToken?: string;
  isActive: boolean;
  isPrimary: boolean;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

export type ApprovalRequestType =
  | "leave"
  | "employee_create"
  | "employee_update"
  | "employee_transfer"
  | "employee_promotion"
  | "salary_change"
  | "department_change"
  | "other";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled" | "expired";

export type ApprovalPriority = "low" | "normal" | "high" | "urgent";

export interface ApprovalRequest {
  id: string;
  companyId: string;
  requestType: ApprovalRequestType;
  entityType: string;
  entityId: string;
  requestedBy: string;
  requestedFor: string;
  requestData: Record<string, unknown>;
  currentStep: number;
  totalSteps: number;
  status: ApprovalStatus;
  priority: ApprovalPriority;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  steps?: ApprovalStep[];
  history?: ApprovalHistory[];
}

export interface ApprovalStep {
  id: string;
  stepNumber: number;
  approverId: string;
  approverType: string;
  status: ApprovalStatus;
  order: number;
}

export interface ApprovalHistory {
  id: string;
  action: string;
  performedBy: string;
  comments?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  roles?: UserRole[];
  children?: MenuItem[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
