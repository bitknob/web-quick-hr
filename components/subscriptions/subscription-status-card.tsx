"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Pause, 
  Play, 
  X,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { Subscription, SubscriptionStatusResponse } from "@/lib/types/subscription";
import { subscriptionApi } from "@/lib/api/subscriptions";
import { useToast } from "@/components/ui/toast";

interface SubscriptionStatusCardProps {
  companyId: string;
  onManageSubscription?: () => void;
  onUpgradePlan?: () => void;
  showActions?: boolean;
}

export function SubscriptionStatusCard({ 
  companyId, 
  onManageSubscription, 
  onUpgradePlan,
  showActions = true 
}: SubscriptionStatusCardProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        setLoading(true);
        const status = await subscriptionApi.getSubscriptionStatus(companyId);
        setSubscriptionStatus(status);
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [companyId]);

  const handlePauseSubscription = async () => {
    if (!subscriptionStatus?.subscription) return;
    
    try {
      setActionLoading(true);
      await subscriptionApi.pauseSubscription(companyId);
      addToast({
        title: "Success",
        description: "Subscription paused successfully",
        variant: "success",
      });
      // Refresh status
      const status = await subscriptionApi.getSubscriptionStatus(companyId);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Failed to pause subscription:', error);
      addToast({
        title: "Error",
        description: "Failed to pause subscription",
        variant: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    if (!subscriptionStatus?.subscription) return;
    
    try {
      setActionLoading(true);
      await subscriptionApi.resumeSubscription(companyId);
      addToast({
        title: "Success",
        description: "Subscription resumed successfully",
        variant: "success",
      });
      // Refresh status
      const status = await subscriptionApi.getSubscriptionStatus(companyId);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Failed to resume subscription:', error);
      addToast({
        title: "Error",
        description: "Failed to resume subscription",
        variant: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscriptionStatus?.subscription) return;
    
    if (!confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading(true);
      await subscriptionApi.cancelSubscription(companyId);
      addToast({
        title: "Success",
        description: "Subscription cancelled successfully",
        variant: "success",
      });
      // Refresh status
      const status = await subscriptionApi.getSubscriptionStatus(companyId);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      addToast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!subscriptionStatus?.hasSubscription) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Active Subscription
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Subscribe to unlock all features and get started with your HR management system.
          </p>
          {showActions && (
            <Button onClick={onUpgradePlan} className="w-full">
              Choose a Plan
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const { subscription } = subscriptionStatus;
  
  if (!subscription) {
    return (
      <Card className="overflow-hidden">
        <div className="p-6">
          <div className="text-center text-gray-500 dark:text-gray-400">
            No subscription data available
          </div>
        </div>
      </Card>
    );
  }
  
  const statusColor = subscriptionApi.getSubscriptionStatusColor(subscription.status);
  const statusIcon = subscriptionApi.getSubscriptionStatusIcon(subscription.status);
  const formattedAmount = subscriptionApi.formatAmount(subscription.amount, subscription.currency);

  return (
    <Card className="overflow-hidden">
      <div className={`p-6 ${subscriptionStatus.actionRequired ? 'border-l-4 border-l-orange-500' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{statusIcon}</span>
              <Badge className={statusColor}>
                {subscriptionApi.formatSubscriptionStatus(subscription.status)}
              </Badge>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {subscription.pricingPlan?.name || 'Subscription Plan'}
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formattedAmount}
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-1">
                /{subscription.interval}
              </span>
            </p>
          </div>
          
          {showActions && (
            <div className="flex items-center gap-2">
              {subscriptionStatus.actionRequired && (
                <Button onClick={onManageSubscription} size="sm" variant="outline">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Action Required
                </Button>
              )}
              <Button onClick={onManageSubscription} size="sm" variant="outline">
                Manage
              </Button>
            </div>
          )}
        </div>

        {/* Status Details */}
        <div className="space-y-4">
          {/* Trial Information */}
          {subscription.status === 'trial' && subscription.isTrialActive && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  Trial Period
                </span>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {subscription.remainingTrialDays} days remaining in your 14-day trial
              </p>
              {subscription.remainingTrialDays && subscription.remainingTrialDays <= 3 && (
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                  Trial ending soon! Add your payment details to continue service.
                </p>
              )}
            </div>
          )}

          {/* Payment Required */}
          {subscriptionStatus.needsPayment && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="font-medium text-orange-900 dark:text-orange-100">
                  Payment Required
                </span>
              </div>
              <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                {subscriptionStatus.message}
              </p>
              {showActions && (
                <Button onClick={onManageSubscription} size="sm" className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Update Payment Method
                </Button>
              )}
            </div>
          )}

          {/* Active Subscription Details */}
          {subscription.status === 'active' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-900 dark:text-green-100">
                  Subscription Active
                </span>
              </div>
              <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <p>Auto-renewal: {subscription.autoRenew ? 'Enabled' : 'Disabled'}</p>
                {subscription.nextBillingDate && (
                  <p>Next billing: {subscriptionApi.formatDate(subscription.nextBillingDate)}</p>
                )}
              </div>
            </div>
          )}

          {/* Paused Subscription */}
          {subscription.status === 'paused' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Pause className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="font-medium text-yellow-900 dark:text-yellow-100">
                  Subscription Paused
                </span>
              </div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Your subscription is currently paused. Resume to continue using the service.
              </p>
            </div>
          )}

          {/* Expired Subscription */}
          {subscription.status === 'expired' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="font-medium text-red-900 dark:text-red-100">
                  Subscription Expired
                </span>
              </div>
              <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                {subscriptionStatus.message}
              </p>
              {showActions && (
                <Button onClick={onManageSubscription} size="sm" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reactivate Subscription
                </Button>
              )}
            </div>
          )}

          {/* Cancelled Subscription */}
          {subscription.status === 'cancelled' && (
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  Subscription Cancelled
                </span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200">
                Your subscription has been cancelled. Choose a new plan to continue using the service.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && subscription.status !== 'cancelled' && (
          <div className="flex gap-2 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            {subscription.status === 'active' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePauseSubscription}
                  disabled={actionLoading}
                >
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelSubscription}
                  disabled={actionLoading}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </>
            )}
            
            {subscription.status === 'paused' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResumeSubscription}
                disabled={actionLoading}
              >
                <Play className="w-4 h-4 mr-1" />
                Resume
              </Button>
            )}

            {subscription.status === 'trial' && (
              <Button onClick={onManageSubscription} size="sm">
                <CreditCard className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            )}

            {subscription.status === 'expired' && (
              <Button onClick={onUpgradePlan} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Choose New Plan
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
