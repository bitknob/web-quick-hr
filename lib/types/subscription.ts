export interface CustomerData {
  name: string;
  email: string;
  contact: string;
}

export interface CreateSubscriptionRequest {
  companyId: string;
  pricingPlanId: number;
  customerData: CustomerData;
  interval: "monthly" | "yearly";
}

export interface CreateSubscriptionWithCompanyRequest {
  companyName: string;
  billingAddress: string;
  pricingPlanId: number;
  customerData: CustomerData;
  interval: "monthly" | "yearly";
}

export interface UpdateSubscriptionRequest {
  autoRenew?: boolean;
  interval?: "monthly" | "yearly";
}

export interface Subscription {
  id: number;
  companyId: string;
  pricingPlanId: number;
  status: "trial" | "active" | "paused" | "expired" | "cancelled";
  trialStartDate?: string;
  trialEndDate?: string;
  isTrialActive: boolean;
  remainingTrialDays?: number;
  needsPayment: boolean;
  amount: number;
  currency: string;
  interval: "monthly" | "yearly";
  autoRenew: boolean;
  isActive: boolean;
  nextBillingDate?: string;
  createdAt: string;
  updatedAt: string;
  pricingPlan?: PricingPlan;
}

export interface PaymentLink {
  id: string;
  short_url: string;
}

export interface CreateSubscriptionResponse {
  subscription: Subscription;
  paymentLink: PaymentLink;
  trialDays: number;
  trialEndDate: string;
}

export interface SubscriptionStatusResponse {
  hasSubscription: boolean;
  status: "trial" | "active" | "paused" | "expired" | "cancelled";
  isActive: boolean;
  isTrialActive?: boolean;
  remainingTrialDays?: number;
  needsPayment?: boolean;
  actionRequired: boolean;
  message: string;
  subscription?: Subscription;
}

export interface SubscriptionResponse {
  subscription: Subscription;
}

export interface SubscriptionsResponse {
  subscriptions: Subscription[];
}

export interface PricingPlan {
  id: number;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
}

export interface WebhookEvent {
  event: string;
  payload: any;
  signature?: string;
}

export interface ApiResponse<T = null> {
  header: {
    responseCode: number;
    responseMessage: string;
    responseDetail: string;
  };
  response: T;
}

// Helper types for subscription management
export type SubscriptionStatus = Subscription["status"];
export type BillingInterval = Subscription["interval"];

// Subscription lifecycle states
export interface SubscriptionLifecycle {
  currentStatus: SubscriptionStatus;
  nextStatus?: SubscriptionStatus;
  actionRequired: boolean;
  daysUntilNextChange?: number;
  message: string;
}

// Payment failure tracking
export interface PaymentFailure {
  id: number;
  subscriptionId: number;
  attemptNumber: number;
  failureReason: string;
  failedAt: string;
  nextRetryDate?: string;
}

// Subscription metrics
export interface SubscriptionMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  churnRate: number;
  trialConversionRate: number;
}
