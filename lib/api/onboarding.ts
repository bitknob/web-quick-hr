import { 
  OnboardingRequest, 
  OnboardingResponse, 
  OnboardingStatusResponse 
} from "@/lib/types/onboarding";
import { apiClient } from "../api-client";

class OnboardingApi {
  async completeOnboarding(data: OnboardingRequest): Promise<OnboardingResponse> {
    const response = await apiClient.post<OnboardingResponse>('/api/onboarding/complete', data);
    return response.response;
  }

  async getOnboardingStatus(subscriptionId: number): Promise<OnboardingStatusResponse> {
    const response = await apiClient.get<OnboardingStatusResponse>(`/api/onboarding/status/${subscriptionId}`);
    return response.response;
  }
}

export const onboardingApi = new OnboardingApi();
