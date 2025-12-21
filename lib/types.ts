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

export type ReimbursementStatus = "draft" | "submitted" | "approved" | "rejected" | "paid";

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
