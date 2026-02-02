// Subscription History Types

export interface SubscriptionHistory {
  id: number;
  subscriptionId: number;
  companyId: string;
  eventType: 'created' | 'updated' | 'cancelled' | 'paused' | 'resumed' | 
           'payment_successful' | 'payment_failed' | 'trial_started' | 
           'trial_ended' | 'plan_changed' | 'reactivated' | 'expired';
  previousStatus?: string;
  newStatus?: string;
  previousPricingPlanId?: number;
  newPricingPlanId?: number;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  transactionId?: string;
  razorpayEventId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface SubscriptionHistoryResponse {
  header: {
    responseCode: number;
    responseMessage: string;
    responseDetail: string;
  };
  response: {
    history: SubscriptionHistory[];
    pagination: Pagination;
  };
}

export interface CompanyHistoryResponse {
  header: {
    responseCode: number;
    responseMessage: string;
    responseDetail: string;
  };
  response: {
    history: SubscriptionHistory[];
    pagination: Pagination;
  };
}

export interface PaymentHistoryResponse {
  header: {
    responseCode: number;
    responseMessage: string;
    responseDetail: string;
  };
  response: {
    history: SubscriptionHistory[];
    pagination: Pagination;
  };
}

export interface EventsByTypeResponse {
  header: {
    responseCode: number;
    responseMessage: string;
    responseDetail: string;
  };
  response: {
    history: SubscriptionHistory[];
    pagination: Pagination;
  };
}

export interface RecentEventsResponse {
  header: {
    responseCode: number;
    responseMessage: string;
    responseDetail: string;
  };
  response: {
    events: SubscriptionHistory[];
    count: number;
  };
}

export interface SubscriptionStatistics {
  totalEvents: number;
  paymentEvents: number;
  successfulPayments: number;
  failedPayments: number;
  statusChanges: number;
  lastPaymentDate?: string;
  totalRevenue: number;
}

export interface SubscriptionStatisticsResponse {
  header: {
    responseCode: number;
    responseMessage: string;
    responseDetail: string;
  };
  response: {
    statistics: SubscriptionStatistics;
  };
}

export interface PaymentSummary {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  totalRevenue: number;
  averagePaymentAmount: number;
  successRate: number;
  paymentsByMonth: Record<string, {
    successful: number;
    failed: number;
    revenue: number;
  }>;
  lastPaymentDate?: string;
}

export interface PaymentSummaryResponse {
  header: {
    responseCode: number;
    responseMessage: string;
    responseDetail: string;
  };
  response: {
    summary: PaymentSummary;
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
