export interface PricingPlanFeature {
  name: string;
  included: boolean;
}

export interface PricingPlan {
  id: number;
  name: string;
  description: string;
  monthlyPrice: number; // INR
  yearlyPrice: number; // INR
  features: PricingPlanFeature[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePricingPlanRequest {
  name: string;
  description?: string;
  monthlyPrice: number; // INR
  yearlyPrice: number; // INR
  features: PricingPlanFeature[];
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePricingPlanRequest {
  name?: string;
  description?: string;
  monthlyPrice?: number; // INR
  yearlyPrice?: number; // INR
  features?: PricingPlanFeature[];
  isActive?: boolean;
  sortOrder?: number;
}

export interface PricingPlansResponse {
  header: {
    responseCode: number;
    responseMessage: string;
    responseDetail: string;
  };
  response: {
    pricingPlans: PricingPlan[];
  };
}

export interface PricingPlanResponse {
  header: {
    responseCode: number;
    responseMessage: string;
    responseDetail: string;
  };
  response: {
    pricingPlan: PricingPlan;
  };
}

export interface ApiResponse<T = null> {
  header: {
    responseCode: number;
    responseMessage: string;
    responseDetail: string;
  };
  response: T;
}
