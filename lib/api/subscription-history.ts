import { 
  SubscriptionHistory,
  SubscriptionHistoryResponse,
  CompanyHistoryResponse,
  PaymentHistoryResponse,
  EventsByTypeResponse,
  RecentEventsResponse,
  SubscriptionStatisticsResponse,
  PaymentSummaryResponse,
  Pagination,
  SubscriptionStatistics,
  PaymentSummary
} from "@/lib/types/subscription-history";
import { apiClient } from "../api-client";

class SubscriptionHistoryApi {
  // Get subscription history
  async getSubscriptionHistory(
    subscriptionId: number, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<{ history: SubscriptionHistory[]; pagination: Pagination }> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    const response = await apiClient.get<SubscriptionHistoryResponse>(
      `/api/subscription-history/subscription/${subscriptionId}?${params.toString()}`
    );
    return response.response.response;
  }

  // Get company subscription history
  async getCompanyHistory(
    companyId: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<{ history: SubscriptionHistory[]; pagination: Pagination }> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    const response = await apiClient.get<CompanyHistoryResponse>(
      `/api/subscription-history/company/${companyId}?${params.toString()}`
    );
    return response.response.response;
  }

  // Get payment history for subscription
  async getPaymentHistory(
    subscriptionId: number, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<{ history: SubscriptionHistory[]; pagination: Pagination }> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    const response = await apiClient.get<PaymentHistoryResponse>(
      `/api/subscription-history/subscription/${subscriptionId}/payments?${params.toString()}`
    );
    return response.response.response;
  }

  // Get events by type for subscription
  async getEventsByType(
    subscriptionId: number, 
    eventType: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<{ history: SubscriptionHistory[]; pagination: Pagination }> {
    const params = new URLSearchParams();
    params.append('eventType', eventType);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    const response = await apiClient.get<EventsByTypeResponse>(
      `/api/subscription-history/subscription/${subscriptionId}/events?${params.toString()}`
    );
    return response.response.response;
  }

  // Get recent events for company
  async getRecentEvents(companyId: string, limit: number = 10): Promise<{ events: SubscriptionHistory[]; count: number }> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    
    const response = await apiClient.get<RecentEventsResponse>(
      `/api/subscription-history/company/${companyId}/recent?${params.toString()}`
    );
    return response.response.response;
  }

  // Get subscription statistics
  async getSubscriptionStatistics(subscriptionId: number): Promise<SubscriptionStatistics> {
    const response = await apiClient.get<SubscriptionStatisticsResponse>(
      `/api/subscription-history/subscription/${subscriptionId}/statistics`
    );
    return response.response.response.statistics;
  }

  // Get company payment summary
  async getCompanyPaymentSummary(companyId: string): Promise<PaymentSummary> {
    const response = await apiClient.get<PaymentSummaryResponse>(
      `/api/subscription-history/company/${companyId}/payment-summary`
    );
    return response.response.response.summary;
  }

  // Helper method to format currency
  formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Helper method to format date
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Helper method to get event type display name
  getEventDisplayName(eventType: string): string {
    const eventNames: Record<string, string> = {
      'created': 'Subscription Created',
      'updated': 'Subscription Updated',
      'cancelled': 'Subscription Cancelled',
      'paused': 'Subscription Paused',
      'resumed': 'Subscription Resumed',
      'payment_successful': 'Payment Successful',
      'payment_failed': 'Payment Failed',
      'trial_started': 'Trial Started',
      'trial_ended': 'Trial Ended',
      'plan_changed': 'Plan Changed',
      'reactivated': 'Subscription Reactivated',
      'expired': 'Subscription Expired',
    };
    return eventNames[eventType] || eventType;
  }

  // Helper method to get event type color
  getEventColor(eventType: string): string {
    const eventColors: Record<string, string> = {
      'created': 'green',
      'updated': 'blue',
      'cancelled': 'red',
      'paused': 'orange',
      'resumed': 'green',
      'payment_successful': 'green',
      'payment_failed': 'red',
      'trial_started': 'blue',
      'trial_ended': 'orange',
      'plan_changed': 'purple',
      'reactivated': 'green',
      'expired': 'red',
    };
    return eventColors[eventType] || 'gray';
  }

  // Helper method to filter payment events
  filterPaymentEvents(history: SubscriptionHistory[]): SubscriptionHistory[] {
    return history.filter(event => 
      event.eventType === 'payment_successful' || 
      event.eventType === 'payment_failed'
    );
  }

  // Helper method to filter status change events
  filterStatusEvents(history: SubscriptionHistory[]): SubscriptionHistory[] {
    return history.filter(event => 
      ['created', 'cancelled', 'paused', 'resumed', 'trial_started', 'trial_ended', 'plan_changed', 'reactivated', 'expired']
      .includes(event.eventType)
    );
  }

  // Helper method to calculate success rate
  calculateSuccessRate(history: SubscriptionHistory[]): number {
    const paymentEvents = this.filterPaymentEvents(history);
    if (paymentEvents.length === 0) return 0;
    
    const successfulPayments = paymentEvents.filter(event => event.eventType === 'payment_successful').length;
    return Math.round((successfulPayments / paymentEvents.length) * 100);
  }

  // Helper method to calculate total revenue
  calculateTotalRevenue(history: SubscriptionHistory[]): number {
    const successfulPayments = history.filter(event => 
      event.eventType === 'payment_successful' && event.amount
    );
    return successfulPayments.reduce((total, payment) => total + (payment.amount || 0), 0);
  }
}

export const subscriptionHistoryApi = new SubscriptionHistoryApi();
