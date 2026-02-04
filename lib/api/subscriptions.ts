import { 
  Subscription, 
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  CreateSubscriptionResponse,
  SubscriptionStatusResponse,
  SubscriptionResponse,
  ApiResponse,
  SubscriptionStatus,
  CustomerData,
  SubscriptionLifecycle,
  SubscriptionMetrics
} from "@/lib/types/subscription";
import { apiClient } from "../api-client";

class SubscriptionApi {
  // Core subscription operations
  async createSubscription(data: CreateSubscriptionRequest): Promise<CreateSubscriptionResponse> {
    const response = await apiClient.post<CreateSubscriptionResponse>('/api/subscriptions', data);
    return response.response;
  }

  async getSubscription(companyId: string): Promise<SubscriptionResponse> {
    const response = await apiClient.get<SubscriptionResponse>(`/api/subscriptions/${companyId}`);
    return response.response;
  }

  async getSubscriptionById(subscriptionId: number): Promise<CreateSubscriptionResponse> {
    const response = await apiClient.get<CreateSubscriptionResponse>(`/api/subscriptions/${subscriptionId}`);
    return response.response;
  }

  async getSubscriptionStatus(companyId: string): Promise<SubscriptionStatusResponse> {
    const response = await apiClient.get<SubscriptionStatusResponse>(`/api/subscriptions/status/${companyId}`);
    return response.response;
  }

  async updateSubscription(companyId: string, data: UpdateSubscriptionRequest): Promise<SubscriptionResponse> {
    const response = await apiClient.put<SubscriptionResponse>(`/api/subscriptions/${companyId}`, data);
    return response.response;
  }

  async cancelSubscription(companyId: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/api/subscriptions/${companyId}`);
  }

  // Pause subscription
  async pauseSubscription(companyId: string): Promise<SubscriptionResponse> {
    const response = await apiClient.patch<SubscriptionResponse>(`/api/subscriptions/${companyId}/pause`);
    return response.response;
  }

  // Resume subscription
  async resumeSubscription(companyId: string): Promise<SubscriptionResponse> {
    const response = await apiClient.patch<SubscriptionResponse>(`/api/subscriptions/${companyId}/resume`);
    return response.response;
  }

  // Webhook handler
  async handleWebhook(webhookData: unknown): Promise<void> {
    await apiClient.post<ApiResponse<null>>('/api/subscriptions/webhook', webhookData);
  }

  // Helper methods for subscription management
  formatSubscriptionStatus(status: SubscriptionStatus): string {
    switch (status) {
      case 'trial':
        return 'Trial';
      case 'active':
        return 'Active';
      case 'paused':
        return 'Paused';
      case 'expired':
        return 'Expired';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  getSubscriptionStatusColor(status: SubscriptionStatus): string {
    switch (status) {
      case 'trial':
        return 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30';
      case 'active':
        return 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/30';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30';
      case 'expired':
        return 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/30';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-900/30';
    }
  }

  getSubscriptionStatusIcon(status: SubscriptionStatus): string {
    switch (status) {
      case 'trial':
        return '⏳';
      case 'active':
        return '✅';
      case 'paused':
        return '⏸️';
      case 'expired':
        return '❌';
      case 'cancelled':
        return '🚫';
      default:
        return '❓';
    }
  }

  // Trial management helpers
  isTrialActive(subscription: Subscription): boolean {
    return subscription.status === 'trial' && 
           subscription.trialEndDate !== undefined && 
           new Date(subscription.trialEndDate) > new Date();
  }

  getRemainingTrialDays(subscription: Subscription): number | null {
    if (!subscription.trialEndDate) return null;
    
    const trialEnd = new Date(subscription.trialEndDate);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  isTrialExpiringSoon(subscription: Subscription, daysThreshold: number = 3): boolean {
    const remainingDays = this.getRemainingTrialDays(subscription);
    return remainingDays !== null && remainingDays <= daysThreshold && remainingDays > 0;
  }

  // Payment management helpers
  needsPayment(subscription: Subscription): boolean {
    return subscription.needsPayment || false;
  }

  getNextBillingDate(subscription: Subscription): Date | null {
    if (!subscription.nextBillingDate) return null;
    return new Date(subscription.nextBillingDate);
  }

  getDaysUntilNextBilling(subscription: Subscription): number | null {
    const nextBilling = this.getNextBillingDate(subscription);
    if (!nextBilling) return null;
    
    const now = new Date();
    const diffTime = nextBilling.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Subscription lifecycle helpers
  getSubscriptionLifecycle(subscription: Subscription): SubscriptionLifecycle {
    const currentStatus = subscription.status;
    const isTrialActive = this.isTrialActive(subscription);
    const remainingTrialDays = this.getRemainingTrialDays(subscription);
    const needsPayment = this.needsPayment(subscription);
    
    let actionRequired = false;
    let nextStatus: SubscriptionStatus | undefined;
    let daysUntilNextChange: number | undefined;
    let message = '';

    switch (currentStatus) {
      case 'trial':
        if (isTrialActive) {
          if (remainingTrialDays !== null && remainingTrialDays <= 3) {
            actionRequired = true;
            message = `Trial ending in ${remainingTrialDays} day${remainingTrialDays !== 1 ? 's' : ''}`;
            daysUntilNextChange = remainingTrialDays;
          } else {
            message = `Trial active - ${remainingTrialDays} day${remainingTrialDays !== 1 ? 's' : ''} remaining`;
          }
          nextStatus = 'active';
        } else {
          actionRequired = true;
          message = 'Trial ended - payment required';
          nextStatus = needsPayment ? 'expired' : 'active';
        }
        break;

      case 'active':
        if (needsPayment) {
          actionRequired = true;
          message = 'Payment required to maintain service';
          nextStatus = 'expired';
        } else {
          const daysUntilBilling = this.getDaysUntilNextBilling(subscription);
          if (daysUntilBilling !== null && daysUntilBilling <= 3) {
            message = `Payment due in ${daysUntilBilling} day${daysUntilBilling !== 1 ? 's' : ''}`;
            daysUntilNextChange = daysUntilBilling;
          } else {
            message = 'Subscription active';
          }
        }
        break;

      case 'paused':
        message = 'Subscription paused';
        nextStatus = 'active';
        break;

      case 'expired':
        actionRequired = true;
        message = 'Subscription expired - payment required to reactivate';
        nextStatus = 'active';
        break;

      case 'cancelled':
        message = 'Subscription cancelled';
        break;

      default:
        message = 'Unknown subscription status';
    }

    return {
      currentStatus,
      nextStatus,
      actionRequired,
      daysUntilNextChange,
      message
    };
  }

  // Validation helpers for new API structure
  validateSubscriptionData(data: CreateSubscriptionRequest): string[] {
    const errors: string[] = [];
    
    if (!data.pricingPlanId || data.pricingPlanId <= 0) {
      errors.push('Valid pricing plan ID is required');
    }
    
    if (!data.customerData) {
      errors.push('Customer data is required');
    } else {
      // Validate personal email (allows gmail, yahoo, etc.)
      if (!data.customerData.personalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerData.personalEmail)) {
        errors.push('Valid personal email is required');
      }
      
      // Validate company email (business email)
      if (!data.customerData.companyEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerData.companyEmail)) {
        errors.push('Valid company email is required');
      }
      
      // Validate company name
      if (!data.customerData.companyName || data.customerData.companyName.trim().length === 0) {
        errors.push('Company name is required');
      }
      
      // Validate company code (minimum 2 characters)
      if (!data.customerData.companyCode || data.customerData.companyCode.trim().length < 2) {
        errors.push('Company code is required (minimum 2 characters)');
      }
      
      // Validate first name
      if (!data.customerData.firstName || data.customerData.firstName.trim().length === 0) {
        errors.push('First name is required');
      }
      
      // Validate last name
      if (!data.customerData.lastName || data.customerData.lastName.trim().length === 0) {
        errors.push('Last name is required');
      }
      
      // Validate password (minimum 6 characters)
      if (!data.customerData.password || data.customerData.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
      }
      
      // Validate contact (optional but if provided, must be valid)
      if (data.customerData.contact && !/^[+]?[\d\s-()]+$/.test(data.customerData.contact)) {
        errors.push('Valid contact number is required');
      }
    }
    
    if (!data.interval || !['monthly', 'yearly'].includes(data.interval)) {
      errors.push('Valid billing interval is required (monthly or yearly)');
    }
    
    return errors;
  }

  // Currency formatting
  formatAmount(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Date formatting
  formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Razorpay integration helpers (updated for new API)
  generateRazorpayOptions(subscription: CreateSubscriptionResponse, customerData: CustomerData) {
    return {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      subscription_id: subscription.subscription.id.toString(),
      name: customerData.name,
      description: `Subscription for HRM Service`,
      image: '/logo.png',
      handler: function (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) {
        // Handle successful payment
        console.log('Payment successful:', response);
      },
      modal: {
        ondismiss: function() {
          // Handle modal dismissal
          console.log('Payment modal dismissed');
        }
      },
      prefill: {
        name: customerData.name,
        email: customerData.personalEmail, // Use personal email for subscription users
        contact: customerData.contact
      },
      theme: {
        color: '#3399cc'
      }
    };
  }

  // Analytics helpers
  calculateSubscriptionMetrics(subscriptions: Subscription[]): SubscriptionMetrics {
    const total = subscriptions.length;
    const active = subscriptions.filter(s => s.status === 'active').length;
    const trial = subscriptions.filter(s => s.status === 'trial').length;
    const expired = subscriptions.filter(s => s.status === 'expired').length;
    const cancelled = subscriptions.filter(s => s.status === 'cancelled').length;
    
    const monthlyRevenue = subscriptions
      .filter(s => s.status === 'active' && s.interval === 'monthly')
      .reduce((sum, s) => sum + s.amount, 0);
    
    const yearlyRevenue = subscriptions
      .filter(s => s.status === 'active' && s.interval === 'yearly')
      .reduce((sum, s) => sum + s.amount, 0);
    
    const churnRate = total > 0 ? (expired + cancelled) / total : 0;
    const trialConversionRate = trial > 0 ? active / (trial + active) : 0;
    
    return {
      totalSubscriptions: total,
      activeSubscriptions: active,
      trialSubscriptions: trial,
      expiredSubscriptions: expired,
      cancelledSubscriptions: cancelled,
      monthlyRevenue,
      yearlyRevenue,
      churnRate,
      trialConversionRate
    };
  }
}

export const subscriptionApi = new SubscriptionApi();
