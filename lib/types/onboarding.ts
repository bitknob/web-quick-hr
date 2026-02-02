export interface OnboardingUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
}

export interface OnboardingCompanyData {
  name: string;
  code: string;
  description?: string;
  industry?: string;
  website?: string;
  phone?: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface OnboardingEmployeeData {
  department?: string;
  designation?: string;
  workLocation?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'intern';
  dateOfJoining?: string;
  workEmail?: string;
  workPhone?: string;
}

export interface OnboardingRequest {
  subscriptionId: number;
  userData: OnboardingUserData;
  companyData: OnboardingCompanyData;
  employeeData?: OnboardingEmployeeData;
}

export interface OnboardingResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    status: string;
  };
  company: {
    id: string;
    name: string;
    code: string;
    email: string;
    status: string;
  };
  employee: {
    id: string;
    department: string;
    designation: string;
    status: string;
  };
  subscription: {
    id: number;
    status: string;
    trialEndDate?: string;
  };
  token: string;
}

export interface OnboardingStatusResponse {
  subscriptionId: number;
  isOnboarded: boolean;
  subscription: {
    status: string;
    trialEndDate?: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  };
  company?: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
}
