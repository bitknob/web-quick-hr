"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubscriptionStatusCard } from "@/components/subscriptions/subscription-status-card";
import SubscriptionCreation from "@/components/subscriptions/subscription-creation";
import { subscriptionApi } from "@/lib/api/subscriptions";
import { pricingApi } from "@/lib/api/pricing";
import { useToast } from "@/components/ui/toast";
import { ArrowLeft, CreditCard, Settings, BarChart3 } from "lucide-react";

type ViewMode = "status" | "create" | "manage";

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("status");
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<"monthly" | "yearly">("monthly");
  const { addToast } = useToast();

  useEffect(() => {
    // Read URL parameters
    const planId = searchParams.get("plan");
    const interval = searchParams.get("interval") as "monthly" | "yearly" | null;
    
    if (planId) {
      setSelectedPlanId(parseInt(planId));
    }
    if (interval) {
      setSelectedInterval(interval);
    }
    
    // If plan is specified, default to create view
    if (planId) {
      setViewMode("create");
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchPricingPlans = async () => {
        try {
          // Fetch pricing plans from API
          const plans = await pricingApi.getPricingPlans(true);
          setAvailablePlans(plans);
        } catch (error) {
          console.error("Error fetching pricing plans:", error);
          addToast({
            title: "Error",
            description: "Failed to load pricing plans",
            variant: "error",
          });
        } finally {
          setLoading(false);
        }
    };

    fetchPricingPlans();
  }, [addToast]);

  const handleCreateSubscription = () => {
    setViewMode("create");
  };

  const handleManageSubscription = () => {
    setViewMode("manage");
  };

  const handleSubscriptionSuccess = () => {
    setViewMode("status");
  };

  const handleCancel = () => {
    setViewMode("status");
  };

  // This would come from your auth context or company context
  const companyId = "current-company-id"; // Replace with actual company ID

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            {viewMode !== "status" && (
              <Button
                variant="outline"
                onClick={() => setViewMode("status")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Subscription Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your subscription, billing, and payment methods
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode("status")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                viewMode === "status"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Subscription Status
              </div>
            </button>
            <button
              onClick={handleCreateSubscription}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                viewMode === "create"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Create Subscription
              </div>
            </button>
            <button
              onClick={handleManageSubscription}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                viewMode === "manage"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Manage Subscription
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          {viewMode === "status" && (
            <div className="space-y-6">
              <SubscriptionStatusCard
                companyId={companyId}
                onManageSubscription={handleManageSubscription}
                onUpgradePlan={handleCreateSubscription}
                showActions={true}
              />
              
              {/* Additional subscription information */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Subscription Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">14-Day Free Trial</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Full access to all features during trial period
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Cancel Anytime</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        No long-term commitments, cancel when you want
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Priority Support</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get help when you need it with our support team
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {viewMode === "create" && (
            <SubscriptionCreation
              availablePlans={availablePlans}
              initialPlanId={selectedPlanId || undefined}
              initialInterval={selectedInterval}
              onSuccess={handleSubscriptionSuccess}
              onCancel={handleCancel}
            />
          )}

          {viewMode === "manage" && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Subscription Management
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Manage your subscription settings, payment methods, and billing information.
                </p>
                
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Update Payment Method
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Billing History
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Subscription Settings
                  </Button>
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Payment Methods
                </h3>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>No payment methods added yet</p>
                  <Button className="mt-4">
                    Add Payment Method
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
