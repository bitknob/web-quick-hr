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
  mustChangePassword?: boolean;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  userEmail: string;
  companyId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  userCompEmail: string;
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
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    userCompEmail: string;
    jobTitle: string;
  };
}

export interface UserCredentials {
  email: string;
  temporaryPassword: string;
  mustChangePassword: boolean;
}

export interface CreateEmployeeResponse {
  employee: Employee;
  userCredentials: UserCredentials | null;
}

export interface SuperAdminEmployeeResponse {
  id: null;
  userEmail: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
  hasEmployeeRecord: boolean;
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
  parentDepartmentId?: string;
  hasSubDepartments?: boolean;
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

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired";

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

export interface Role {
  id: string;
  roleKey: string;
  name: string;
  description?: string;
  hierarchyLevel: number;
  parentRoleId?: string;
  companyId?: string;
  isSystemRole: boolean;
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
  createdAt: string;
  updatedAt: string;
}

export interface UserModule {
  id: string;
  userId: string;
  moduleKey: string;
  moduleName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Payroll Types
export interface SalaryComponent {
  id?: string;
  componentName: string;
  componentType: "earning" | "deduction";
  componentCategory: string;
  isPercentage: boolean;
  value: number;
  percentageOf?: string;
  isTaxable: boolean;
  isStatutory: boolean;
  priority: number;
  isActive?: boolean;
}

export interface SalaryStructure {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  isActive: boolean;
  components?: SalaryComponent[];
  createdAt: string;
  updatedAt: string;
}

export interface TaxSlab {
  from: number;
  to: number | null;
  rate?: number;
  amount?: number;
}

export interface HousingAllowanceExemptionRules {
  type: "percentage_of_basic" | "fixed_amount" | "actual_rent";
  maxPercentage?: number;
  minRentPercentage?: number;
  amount?: number;
}

export interface TravelAllowanceExemptionRules {
  type: "actual_expense" | "fixed_amount" | "percentage_of_basic";
  amount?: number;
  percentage?: number;
}

export interface TaxExemptions {
  section80C?: number;
  section80D?: number;
  section80G?: number;
  section24?: number;
  [key: string]: number | undefined;
}

export interface TaxConfiguration {
  id: string;
  companyId: string;
  country: string;
  state?: string;
  province?: string;
  financialYear: string;
  incomeTaxEnabled?: boolean;
  incomeTaxSlabs?: TaxSlab[];
  socialSecurityEnabled?: boolean;
  socialSecurityEmployerRate?: number;
  socialSecurityEmployeeRate?: number;
  socialSecurityMaxSalary?: number;
  healthInsuranceEnabled?: boolean;
  healthInsuranceEmployerRate?: number;
  healthInsuranceEmployeeRate?: number;
  healthInsuranceMaxSalary?: number;
  professionalTaxEnabled?: boolean;
  professionalTaxSlabs?: TaxSlab[];
  housingAllowanceExemptionRules?: HousingAllowanceExemptionRules;
  travelAllowanceExemptionRules?: TravelAllowanceExemptionRules;
  standardDeduction?: number;
  taxExemptions?: TaxExemptions;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRun {
  id: string;
  companyId: string;
  payrollMonth: number;
  payrollYear: number;
  status: "draft" | "processing" | "completed" | "locked" | "failed";
  totalEmployees: number;
  processedEmployees: number;
  failedEmployees: number;
  processedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  companyId: string;
  payrollRunId: string;
  payslipNumber: string;
  month: number;
  year: number;
  status: "generated" | "approved" | "locked";
  ctc: number;
  grossSalary: number;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  earningsBreakdown: Record<string, number>;
  deductionsBreakdown: Record<string, number>;
  tdsAmount: number;
  professionalTaxAmount: number;
  epfEmployeeAmount: number;
  epfEmployerAmount: number;
  esiEmployeeAmount: number;
  esiEmployerAmount: number;
  taxExemptions?: {
    housingAllowanceExemption: number;
    travelAllowanceExemption: number;
    standardDeduction: number;
    totalExemptions: number;
  };
  taxableIncome: number;
  createdAt: string;
}

export interface PayslipTemplate {
  id: string;
  companyId: string;
  templateName: string;
  templateType: "simple" | "detailed" | "custom";
  description?: string;
  headerConfiguration?: Record<string, unknown>;
  footerConfiguration?: Record<string, unknown>;
  bodyConfiguration?: Record<string, unknown>;
  stylingConfiguration?: Record<string, unknown>;
  sectionsConfiguration?: Record<string, unknown>;
  watermarkSettings?: Record<string, unknown>;
  brandingSettings?: Record<string, unknown>;
  isDefault: boolean;
  status?: "draft" | "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface PayslipSchedule {
  id: string;
  companyId: string;
  scheduleName: string;
  description?: string;
  frequency: "monthly" | "biweekly" | "weekly" | "custom";
  generationDay?: number;
  generationTime: string;
  timezone: string;
  triggerType: "scheduled" | "manual";
  autoApprove?: boolean;
  autoSend?: boolean;
  emailConfiguration?: Record<string, unknown>;
  notificationConfiguration?: Record<string, unknown>;
  enabledMonths?: number[];
  enabledYears?: number[];
  excludedDates?: string[];
  nextRunAt?: string;
  status?: "active" | "inactive" | "paused";
  createdAt: string;
  updatedAt: string;
}

export type VariablePayType =
  | "bonus"
  | "incentive"
  | "commission"
  | "overtime"
  | "shift_allowance"
  | "performance_bonus"
  | "retention_bonus"
  | "other";

export interface VariablePay {
  id: string;
  employeeId: string;
  companyId: string;
  variablePayType: VariablePayType;
  description?: string;
  amount: number;
  calculationBasis?: string;
  calculationDetails?: Record<string, unknown>;
  applicableMonth: number;
  applicableYear: number;
  isTaxable: boolean;
  isRecurring: boolean;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ArrearsType =
  | "salary_revision"
  | "promotion"
  | "retroactive_adjustment"
  | "correction"
  | "bonus_arrears"
  | "allowance_adjustment"
  | "other";

export interface Arrears {
  id: string;
  employeeId: string;
  companyId: string;
  arrearsType: ArrearsType;
  description?: string;
  originalPeriodFrom: string;
  originalPeriodTo: string;
  adjustmentAmount: number;
  breakdown?: Record<string, number>;
  reason?: string;
  applicableMonth: number;
  applicableYear: number;
  isTaxable: boolean;
  taxCalculationBasis?: string;
  createdAt: string;
  updatedAt: string;
}

export type LoanType =
  | "personal_loan"
  | "advance_salary"
  | "home_loan"
  | "vehicle_loan"
  | "education_loan"
  | "medical_loan"
  | "other";

export interface Loan {
  id: string;
  employeeId: string;
  companyId: string;
  loanType: LoanType;
  loanName: string;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  startDate: string;
  deductionStartMonth: number;
  deductionStartYear: number;
  loanTerms?: Record<string, unknown>;
  emiAmount: number;
  remainingBalance: number;
  status: "active" | "completed" | "closed";
  createdAt: string;
  updatedAt: string;
}

export type ReimbursementType =
  | "travel"
  | "medical"
  | "meal"
  | "telephone"
  | "internet"
  | "fuel"
  | "conveyance"
  | "other";

export type ReimbursementStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "paid";

export interface Reimbursement {
  id: string;
  employeeId: string;
  companyId: string;
  reimbursementType: ReimbursementType;
  description?: string;
  claimAmount: number;
  approvedAmount?: number;
  claimDate: string;
  documents?: string[];
  expenseBreakdown?: Record<string, number>;
  applicableMonth: number;
  applicableYear: number;
  isTaxable: boolean;
  taxExemptionLimit?: number;
  status: ReimbursementStatus;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxDeclaration {
  id: string;
  employeeId: string;
  companyId: string;
  financialYear: string;
  declarations: Record<string, Record<string, number>>;
  verifiedAmount?: number;
  status: "draft" | "submitted" | "verified" | "rejected";
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeaveType =
  | "annual"
  | "sick"
  | "casual"
  | "maternity"
  | "paternity"
  | "unpaid";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface Leave {
  id: string;
  employeeId: string;
  companyId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
  };
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

export interface CreateLeaveRequest {
  employeeId: string;
  companyId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface UpdateLeaveRequest {
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

export interface GetLeavesByEmployeeParams {
  companyId?: string;
  startDate?: string;
  endDate?: string;
  status?: LeaveStatus;
}

export interface GetLeavesByCompanyParams {
  startDate?: string;
  endDate?: string;
  status?: LeaveStatus;
  leaveType?: LeaveType;
}

export interface SearchLeavesParams {
  companyId?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  status?: LeaveStatus;
  leaveType?: LeaveType;
  page?: number;
  limit?: number;
}

export type AttendanceStatus = "present" | "absent" | "late" | "half_day";

export interface Attendance {
  id: string;
  employeeId: string;
  companyId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
  };
}

export interface CreateAttendanceRequest {
  employeeId: string;
  companyId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status?: AttendanceStatus;
  notes?: string;
}

export interface UpdateAttendanceRequest {
  checkIn?: string;
  checkOut?: string;
  status?: AttendanceStatus;
  notes?: string;
}

export interface CheckInRequest {
  checkInTime?: string;
}

export interface CheckOutRequest {
  checkOutTime?: string;
}

export interface GetAttendanceByEmployeeParams {
  companyId?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetAttendanceByCompanyParams {
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
}

export interface GetAttendanceStatsParams {
  month: number;
  year: number;
}

export interface AttendanceStats {
  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  lateDays: number;
  halfDayDays: number;
}

export interface SearchAttendancesParams {
  companyId?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
}

export type DocumentType =
  | "id_proof"
  | "address_proof"
  | "pan_card"
  | "aadhaar_card"
  | "passport"
  | "driving_license"
  | "educational_certificate"
  | "experience_certificate"
  | "offer_letter"
  | "appointment_letter"
  | "relieving_letter"
  | "salary_slip"
  | "bank_statement"
  | "form_16"
  | "other";

export type DocumentStatus = "pending" | "verified" | "rejected" | "expired";

export interface Document {
  id: string;
  employeeId: string;
  companyId: string;
  documentType: DocumentType;
  documentName: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  expiryDate?: string;
  notes?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
  };
  verifier?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

export interface UploadDocumentRequest {
  document: File;
  employeeId: string;
  companyId: string;
  documentType: DocumentType;
  documentName: string;
  expiryDate?: string;
  notes?: string;
}

export interface UpdateDocumentRequest {
  documentName?: string;
  expiryDate?: string;
  notes?: string;
}

export interface RejectDocumentRequest {
  rejectionReason: string;
}

export interface GetDocumentsByEmployeeParams {
  companyId?: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
}

export interface GetDocumentsByCompanyParams {
  documentType?: DocumentType;
  status?: DocumentStatus;
}

export interface SearchDocumentsParams {
  companyId?: string;
  employeeId?: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
  page?: number;
  limit?: number;
}

export type MaritalStatus = "single" | "married" | "divorced" | "widowed";

export interface EmployeeDetails {
  id: string;
  employeeId: string;
  companyId: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  bankIFSC?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  passportNumber?: string;
  drivingLicenseNumber?: string;
  bloodGroup?: string;
  maritalStatus?: MaritalStatus;
  spouseName?: string;
  fatherName?: string;
  motherName?: string;
  permanentAddress?: string;
  currentAddress?: string;
  previousEmployer?: string;
  previousDesignation?: string;
  previousSalary?: number;
  noticePeriod?: number;
  skills?: string[];
  languages?: string[];
  additionalInfo?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
  };
}

export interface CreateOrUpdateEmployeeDetailsRequest {
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  bankIFSC?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  passportNumber?: string;
  drivingLicenseNumber?: string;
  bloodGroup?: string;
  maritalStatus?: MaritalStatus;
  spouseName?: string;
  fatherName?: string;
  motherName?: string;
  permanentAddress?: string;
  currentAddress?: string;
  previousEmployer?: string;
  previousDesignation?: string;
  previousSalary?: number;
  noticePeriod?: number;
  skills?: string[];
  languages?: string[];
  additionalInfo?: Record<string, unknown>;
}

export type UpdateEmployeeDetailsRequest = CreateOrUpdateEmployeeDetailsRequest;
