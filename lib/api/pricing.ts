import { 
  PricingPlan, 
  CreatePricingPlanRequest, 
  UpdatePricingPlanRequest,
  PricingPlansResponse,
  PricingPlanResponse,
  ApiResponse 
} from "@/lib/types/pricing";
import { apiClient } from "../api-client";

class PricingApi {
  async getPricingPlans(activeOnly: boolean = true): Promise<PricingPlan[]> {
    const params = new URLSearchParams();
    if (activeOnly) {
      params.append('activeOnly', 'true');
    }
    
    const response = await apiClient.get<PricingPlansResponse>(`/api/pricing-plans?${params.toString()}`);
    console.log('API Response:', JSON.stringify(response, null, 2));
    
    // Try different access patterns
    if (response.response?.response?.pricingPlans) {
      return response.response.response.pricingPlans;
    } else if (response.response?.pricingPlans) {
      return response.response.pricingPlans;
    } else if (response.pricingPlans) {
      return response.pricingPlans;
    } else {
      console.error('Unable to find pricingPlans in response. Response structure:', response);
      throw new Error('Invalid API response structure');
    }
  }

  async getPricingPlan(id: number): Promise<PricingPlan> {
    const response = await apiClient.get<PricingPlanResponse>(`/api/pricing-plans/${id}`);
    return response.response.response.pricingPlan;
  }

  async createPricingPlan(plan: CreatePricingPlanRequest): Promise<PricingPlan> {
    const response = await apiClient.post<PricingPlanResponse>('/api/pricing-plans', plan);
    return response.response.response.pricingPlan;
  }

  async updatePricingPlan(id: number, plan: UpdatePricingPlanRequest): Promise<PricingPlan> {
    const response = await apiClient.put<PricingPlanResponse>(`/api/pricing-plans/${id}`, plan);
    return response.response.response.pricingPlan;
  }

  async deletePricingPlan(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/api/pricing-plans/${id}`);
  }

  async togglePricingPlanStatus(id: number): Promise<PricingPlan> {
    const response = await apiClient.patch<PricingPlanResponse>(`/api/pricing-plans/${id}/toggle`);
    return response.response.response.pricingPlan;
  }

  // Helper method to format price in INR
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  // Helper method to validate pricing plan data
  validatePricingPlan(plan: CreatePricingPlanRequest | UpdatePricingPlanRequest): string[] {
    const errors: string[] = [];
    
    if ('name' in plan && plan.name && plan.name.length > 100) {
      errors.push('Name must be less than 100 characters');
    }
    
    if ('description' in plan && plan.description && plan.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }
    
    if ('monthlyPrice' in plan && plan.monthlyPrice !== undefined && plan.monthlyPrice < 0) {
      errors.push('Monthly price must be non-negative');
    }
    
    if ('yearlyPrice' in plan && plan.yearlyPrice !== undefined && plan.yearlyPrice < 0) {
      errors.push('Yearly price must be non-negative');
    }
    
    if ('features' in plan && plan.features && plan.features.length === 0) {
      errors.push('At least one feature is required');
    }
    
    if ('sortOrder' in plan && plan.sortOrder !== undefined && plan.sortOrder < 0) {
      errors.push('Sort order must be non-negative');
    }
    
    return errors;
  }
}

export const pricingApi = new PricingApi();
