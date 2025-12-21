import { apiClient, ApiResponse } from "../api-client";
import {
  SalaryStructure,
  SalaryComponent,
  TaxConfiguration,
  PayrollRun,
  Payslip,
  PayslipTemplate,
  PayslipSchedule,
  VariablePay,
  Arrears,
  Loan,
  Reimbursement,
  TaxDeclaration,
  PaginatedResponse,
} from "../types";

// Salary Structure Management
export interface CreateSalaryStructureRequest {
  companyId: string;
  name: string;
  description?: string;
  components: Omit<SalaryComponent, "id">[];
}

export interface UpdateSalaryStructureRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface AssignSalaryStructureRequest {
  employeeId: string;
  companyId: string;
  salaryStructureId: string;
  ctc: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

// Tax Configuration Management
export interface CreateTaxConfigurationRequest {
  companyId: string;
  country: string;
  state?: string;
  province?: string;
  financialYear: string;
  incomeTaxEnabled?: boolean;
  incomeTaxSlabs?: Array<{ from: number; to: number | null; rate: number }>;
  socialSecurityEnabled?: boolean;
  socialSecurityEmployerRate?: number;
  socialSecurityEmployeeRate?: number;
  socialSecurityMaxSalary?: number;
  healthInsuranceEnabled?: boolean;
  healthInsuranceEmployerRate?: number;
  healthInsuranceEmployeeRate?: number;
  healthInsuranceMaxSalary?: number;
  professionalTaxEnabled?: boolean;
  professionalTaxSlabs?: Array<{ from: number; to: number | null; amount: number }>;
  housingAllowanceExemptionRules?: {
    type: "percentage_of_basic" | "fixed_amount" | "actual_rent";
    maxPercentage?: number;
    minRentPercentage?: number;
    amount?: number;
  };
  travelAllowanceExemptionRules?: {
    type: "actual_expense" | "fixed_amount" | "percentage_of_basic";
    amount?: number;
    percentage?: number;
  };
  standardDeduction?: number;
  taxExemptions?: Record<string, number>;
}

export interface UpdateTaxConfigurationRequest extends Partial<CreateTaxConfigurationRequest> {}

// Payroll Processing
export interface CreatePayrollRunRequest {
  companyId: string;
  payrollMonth: number;
  payrollYear: number;
  processedBy: string;
}

export interface ProcessPayrollRunRequest {
  processedBy: string;
}

export interface GetPayrollRunsParams {
  page?: number;
  limit?: number;
}

// Payslip Template Management
export interface CreatePayslipTemplateRequest {
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
  isDefault?: boolean;
}

export interface UpdatePayslipTemplateRequest extends Partial<CreatePayslipTemplateRequest> {}

export interface SetDefaultTemplateRequest {
  companyId: string;
}

export interface GeneratePayslipPDFRequest {
  templateId?: string;
  format?: string;
  includeWatermark?: boolean;
  includeLogo?: boolean;
  language?: string;
  currency?: string;
  customStyles?: string;
}

// Payslip Generation Scheduling
export interface CreatePayslipScheduleRequest {
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
}

export interface UpdatePayslipScheduleRequest extends Partial<CreatePayslipScheduleRequest> {}

export interface GetScheduleLogsParams {
  page?: number;
  limit?: number;
}

// Variable Pay Management
export interface CreateVariablePayRequest {
  employeeId: string;
  companyId: string;
  variablePayType: string;
  description?: string;
  amount: number;
  calculationBasis?: string;
  calculationDetails?: Record<string, unknown>;
  applicableMonth: number;
  applicableYear: number;
  isTaxable: boolean;
  isRecurring: boolean;
}

// Arrears Management
export interface CreateArrearsRequest {
  employeeId: string;
  companyId: string;
  arrearsType: string;
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
}

// Loan Management
export interface CreateLoanRequest {
  employeeId: string;
  companyId: string;
  loanType: string;
  loanName: string;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  startDate: string;
  deductionStartMonth: number;
  deductionStartYear: number;
  loanTerms?: Record<string, unknown>;
}

export interface CalculateEMIParams {
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
}

// Reimbursement Management
export interface CreateReimbursementRequest {
  employeeId: string;
  companyId: string;
  reimbursementType: string;
  description?: string;
  claimAmount: number;
  claimDate: string;
  documents?: string[];
  expenseBreakdown?: Record<string, number>;
  applicableMonth: number;
  applicableYear: number;
  isTaxable: boolean;
  taxExemptionLimit?: number;
}

export interface ApproveReimbursementRequest {
  approvedAmount: number;
}

export interface RejectReimbursementRequest {
  rejectionReason: string;
}

// Tax Declaration Management
export interface CreateTaxDeclarationRequest {
  employeeId: string;
  companyId: string;
  financialYear: string;
  declarations: Record<string, Record<string, number>>;
}

export interface VerifyTaxDeclarationRequest {
  verifiedAmount: number;
  notes?: string;
}

export const payrollApi = {
  // Salary Structure Management
  createSalaryStructure: async (
    data: CreateSalaryStructureRequest
  ): Promise<ApiResponse<SalaryStructure>> => {
    return apiClient.post("/api/payroll/salary-structures", data);
  },

  getSalaryStructure: async (id: string): Promise<ApiResponse<SalaryStructure>> => {
    return apiClient.get(`/api/payroll/salary-structures/${id}`);
  },

  getSalaryStructuresByCompany: async (
    companyId: string
  ): Promise<ApiResponse<SalaryStructure[]>> => {
    return apiClient.get(`/api/payroll/salary-structures/company/${companyId}`);
  },

  updateSalaryStructure: async (
    id: string,
    data: UpdateSalaryStructureRequest
  ): Promise<ApiResponse<SalaryStructure>> => {
    return apiClient.put(`/api/payroll/salary-structures/${id}`, data);
  },

  addComponentToSalaryStructure: async (
    id: string,
    component: Omit<SalaryComponent, "id">
  ): Promise<ApiResponse<SalaryComponent>> => {
    return apiClient.post(`/api/payroll/salary-structures/${id}/components`, component);
  },

  updateComponent: async (
    id: string,
    component: Partial<SalaryComponent>
  ): Promise<ApiResponse<SalaryComponent>> => {
    return apiClient.put(`/api/payroll/salary-structures/components/${id}`, component);
  },

  deleteComponent: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/api/payroll/salary-structures/components/${id}`);
  },

  assignSalaryStructure: async (
    data: AssignSalaryStructureRequest
  ): Promise<ApiResponse<SalaryStructure>> => {
    return apiClient.post("/api/payroll/salary-structures/assign", data);
  },

  getEmployeeSalaryStructure: async (
    employeeId: string
  ): Promise<ApiResponse<SalaryStructure>> => {
    return apiClient.get(`/api/payroll/salary-structures/employee/${employeeId}`);
  },

  // Tax Configuration Management
  createTaxConfiguration: async (
    data: CreateTaxConfigurationRequest
  ): Promise<ApiResponse<TaxConfiguration>> => {
    return apiClient.post("/api/payroll/tax-configurations", data);
  },

  getTaxConfiguration: async (id: string): Promise<ApiResponse<TaxConfiguration>> => {
    return apiClient.get(`/api/payroll/tax-configurations/${id}`);
  },

  getTaxConfigurationByCompanyCountryYear: async (
    companyId: string,
    country: string,
    financialYear: string
  ): Promise<ApiResponse<TaxConfiguration>> => {
    return apiClient.get(
      `/api/payroll/tax-configurations/company/${companyId}/country/${country}/year/${financialYear}`
    );
  },

  getTaxConfigurationsByCompany: async (
    companyId: string
  ): Promise<ApiResponse<TaxConfiguration[]>> => {
    return apiClient.get(`/api/payroll/tax-configurations/company/${companyId}`);
  },

  updateTaxConfiguration: async (
    id: string,
    data: UpdateTaxConfigurationRequest
  ): Promise<ApiResponse<TaxConfiguration>> => {
    return apiClient.put(`/api/payroll/tax-configurations/${id}`, data);
  },

  // Payroll Processing
  createPayrollRun: async (data: CreatePayrollRunRequest): Promise<ApiResponse<PayrollRun>> => {
    return apiClient.post("/api/payroll/runs", data);
  },

  processPayrollRun: async (
    id: string,
    data: ProcessPayrollRunRequest
  ): Promise<ApiResponse<PayrollRun>> => {
    return apiClient.post(`/api/payroll/runs/${id}/process`, data);
  },

  getPayrollRun: async (id: string): Promise<ApiResponse<PayrollRun>> => {
    return apiClient.get(`/api/payroll/runs/${id}`);
  },

  getPayrollRunsByCompany: async (
    companyId: string,
    params?: GetPayrollRunsParams
  ): Promise<ApiResponse<PaginatedResponse<PayrollRun>>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    return apiClient.get(
      `/api/payroll/runs/company/${companyId}${queryString ? `?${queryString}` : ""}`
    );
  },

  lockPayrollRun: async (id: string): Promise<ApiResponse<PayrollRun>> => {
    return apiClient.post(`/api/payroll/runs/${id}/lock`);
  },

  // Payslip Management
  getPayslip: async (id: string): Promise<ApiResponse<Payslip>> => {
    return apiClient.get(`/api/payroll/payslips/${id}`);
  },

  getPayslipsByEmployee: async (
    employeeId: string,
    params?: GetPayrollRunsParams
  ): Promise<ApiResponse<PaginatedResponse<Payslip>>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    return apiClient.get(
      `/api/payroll/payslips/employee/${employeeId}${queryString ? `?${queryString}` : ""}`
    );
  },

  getPayslipsByPayrollRun: async (
    payrollRunId: string,
    params?: GetPayrollRunsParams
  ): Promise<ApiResponse<PaginatedResponse<Payslip>>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    return apiClient.get(
      `/api/payroll/payslips/run/${payrollRunId}${queryString ? `?${queryString}` : ""}`
    );
  },

  // Payslip Template Management
  createPayslipTemplate: async (
    data: CreatePayslipTemplateRequest
  ): Promise<ApiResponse<PayslipTemplate>> => {
    return apiClient.post("/api/payroll/payslip-templates", data);
  },

  getPayslipTemplate: async (
    id: string,
    companyId?: string
  ): Promise<ApiResponse<PayslipTemplate>> => {
    const queryParams = new URLSearchParams();
    if (companyId) queryParams.append("companyId", companyId);

    const queryString = queryParams.toString();
    return apiClient.get(
      `/api/payroll/payslip-templates/${id}${queryString ? `?${queryString}` : ""}`
    );
  },

  getPayslipTemplatesByCompany: async (
    companyId: string,
    status?: string
  ): Promise<ApiResponse<PayslipTemplate[]>> => {
    const queryParams = new URLSearchParams();
    if (status) queryParams.append("status", status);

    const queryString = queryParams.toString();
    return apiClient.get(
      `/api/payroll/payslip-templates/company/${companyId}${queryString ? `?${queryString}` : ""}`
    );
  },

  updatePayslipTemplate: async (
    id: string,
    data: UpdatePayslipTemplateRequest
  ): Promise<ApiResponse<PayslipTemplate>> => {
    return apiClient.put(`/api/payroll/payslip-templates/${id}`, data);
  },

  setDefaultTemplate: async (
    id: string,
    data: SetDefaultTemplateRequest
  ): Promise<ApiResponse<PayslipTemplate>> => {
    return apiClient.post(`/api/payroll/payslip-templates/${id}/set-default`, data);
  },

  generatePayslipPDF: async (
    payslipId: string,
    data: GeneratePayslipPDFRequest
  ): Promise<ApiResponse<{ filePath: string; fileUrl: string }>> => {
    return apiClient.post(`/api/payroll/payslip-templates/generate-pdf/${payslipId}`, data);
  },

  // Payslip Generation Scheduling
  createPayslipSchedule: async (
    data: CreatePayslipScheduleRequest
  ): Promise<ApiResponse<PayslipSchedule>> => {
    return apiClient.post("/api/payroll/payslip-schedules", data);
  },

  getPayslipSchedule: async (
    id: string,
    companyId?: string
  ): Promise<ApiResponse<PayslipSchedule>> => {
    const queryParams = new URLSearchParams();
    if (companyId) queryParams.append("companyId", companyId);

    const queryString = queryParams.toString();
    return apiClient.get(
      `/api/payroll/payslip-schedules/${id}${queryString ? `?${queryString}` : ""}`
    );
  },

  getPayslipSchedulesByCompany: async (
    companyId: string,
    status?: string
  ): Promise<ApiResponse<PayslipSchedule[]>> => {
    const queryParams = new URLSearchParams();
    if (status) queryParams.append("status", status);

    const queryString = queryParams.toString();
    return apiClient.get(
      `/api/payroll/payslip-schedules/company/${companyId}${queryString ? `?${queryString}` : ""}`
    );
  },

  updatePayslipSchedule: async (
    id: string,
    data: UpdatePayslipScheduleRequest
  ): Promise<ApiResponse<PayslipSchedule>> => {
    return apiClient.put(`/api/payroll/payslip-schedules/${id}`, data);
  },

  getScheduleLogs: async (
    companyId: string,
    params?: GetScheduleLogsParams
  ): Promise<ApiResponse<PaginatedResponse<unknown>>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    return apiClient.get(
      `/api/payroll/payslip-schedules/company/${companyId}/logs${queryString ? `?${queryString}` : ""}`
    );
  },

  // Variable Pay Management
  createVariablePay: async (data: CreateVariablePayRequest): Promise<ApiResponse<VariablePay>> => {
    return apiClient.post("/api/payroll/variable-pay", data);
  },

  approveVariablePay: async (id: string): Promise<ApiResponse<VariablePay>> => {
    return apiClient.post(`/api/payroll/variable-pay/${id}/approve`);
  },

  // Arrears Management
  createArrears: async (data: CreateArrearsRequest): Promise<ApiResponse<Arrears>> => {
    return apiClient.post("/api/payroll/arrears", data);
  },

  // Loan Management
  createLoan: async (data: CreateLoanRequest): Promise<ApiResponse<Loan>> => {
    return apiClient.post("/api/payroll/loans", data);
  },

  calculateEMI: async (
    params: CalculateEMIParams
  ): Promise<ApiResponse<{ emiAmount: number; totalAmount: number; totalInterest: number; repaymentSchedule: unknown[] }>> => {
    const queryParams = new URLSearchParams();
    queryParams.append("principalAmount", params.principalAmount.toString());
    queryParams.append("interestRate", params.interestRate.toString());
    queryParams.append("tenureMonths", params.tenureMonths.toString());

    return apiClient.get(`/api/payroll/loans/calculate-emi?${queryParams.toString()}`);
  },

  getActiveLoans: async (employeeId: string): Promise<ApiResponse<Loan[]>> => {
    return apiClient.get(`/api/payroll/loans/employee/${employeeId}/active`);
  },

  // Reimbursement Management
  createReimbursement: async (
    data: CreateReimbursementRequest
  ): Promise<ApiResponse<Reimbursement>> => {
    return apiClient.post("/api/payroll/reimbursements", data);
  },

  submitReimbursement: async (id: string): Promise<ApiResponse<Reimbursement>> => {
    return apiClient.post(`/api/payroll/reimbursements/${id}/submit`);
  },

  approveReimbursement: async (
    id: string,
    data: ApproveReimbursementRequest
  ): Promise<ApiResponse<Reimbursement>> => {
    return apiClient.post(`/api/payroll/reimbursements/${id}/approve`, data);
  },

  rejectReimbursement: async (
    id: string,
    data: RejectReimbursementRequest
  ): Promise<ApiResponse<Reimbursement>> => {
    return apiClient.post(`/api/payroll/reimbursements/${id}/reject`, data);
  },

  // Tax Declaration Management
  createOrUpdateTaxDeclaration: async (
    data: CreateTaxDeclarationRequest
  ): Promise<ApiResponse<TaxDeclaration>> => {
    return apiClient.post("/api/payroll/tax-declarations", data);
  },

  submitTaxDeclaration: async (id: string): Promise<ApiResponse<TaxDeclaration>> => {
    return apiClient.post(`/api/payroll/tax-declarations/${id}/submit`);
  },

  verifyTaxDeclaration: async (
    id: string,
    data: VerifyTaxDeclarationRequest
  ): Promise<ApiResponse<TaxDeclaration>> => {
    return apiClient.post(`/api/payroll/tax-declarations/${id}/verify`, data);
  },
};

