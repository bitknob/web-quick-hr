"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import SubscriptionCreation from "@/components/subscriptions/subscription-creation";
import { useToast } from "@/components/ui/toast";
import { ArrowLeft, CreditCard, BarChart3 } from "lucide-react";
import { pricingApi } from "@/lib/api/pricing";

function PublicSubscriptionPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<"monthly" | "yearly">("monthly");
  const [subscriptionCreated, setSubscriptionCreated] = useState<any>(null);
  const { addToast } = useToast();

  // Dialog states
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  useEffect(() => {
    const fetchPricingPlans = async () => {
      try {
        // Fetch pricing plans from API
        const plans = await pricingApi.getPricingPlans(true);
        setAvailablePlans(plans);

        // Parse URL parameters after plans are loaded
        const plan = searchParams.get("plan");
        const interval = searchParams.get("interval");
        
        // Handle both string names and numeric IDs
        if (plan) {
          // If it's a string name, find the corresponding plan
          if (isNaN(Number(plan))) {
            const foundPlan = plans.find(p => p.name.toLowerCase() === plan.toLowerCase());
            if (foundPlan) {
              setSelectedPlanId(foundPlan.id);
            }
          } else {
            // If it's a numeric ID, use it directly
            setSelectedPlanId(Number(plan));
          }
        }
        
        if (interval) {
          setSelectedInterval(interval as "monthly" | "yearly");
        }
      } catch (error) {
        console.error("Failed to fetch pricing plans:", error);
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
  }, [searchParams, addToast]);

  const handleSubscriptionSuccess = (subscription: any) => {
    console.log("Subscription created successfully:", subscription);
    setSubscriptionCreated(subscription);
    setDialogMessage("Subscription created successfully! Your 14-day free trial has started. You will be redirected to complete your account setup.");
    setShowSuccessDialog(true);
    
    // Redirect to onboarding after a short delay with customer data
    setTimeout(() => {
      const subscriptionId = subscription.subscription[0].id;
      console.log("Redirecting to onboarding with subscriptionId:", subscriptionId);
      
      // Extract customer data from the subscription response
      // Note: This assumes the API response includes customer data, or we need to store it temporarily
      const customerData = subscription.customerData || {};
      
      // Build URL with customer data as query parameters
      const params = new URLSearchParams();
      params.append('subscriptionId', subscriptionId.toString());
      
      if (customerData.firstName) params.append('firstName', customerData.firstName);
      if (customerData.lastName) params.append('lastName', customerData.lastName);
      if (customerData.personalEmail) params.append('email', customerData.personalEmail);
      if (customerData.contact) params.append('phone', customerData.contact);
      if (customerData.companyName) params.append('companyName', customerData.companyName);
      if (customerData.companyCode) params.append('companyCode', customerData.companyCode);
      if (customerData.companyEmail) params.append('companyEmail', customerData.companyEmail);
      
      router.push(`/onboarding?${params.toString()}`);
    }, 3000);
  };

  const handleGoToDashboard = () => {
    // Redirect to onboarding instead of login
    if (subscriptionCreated) {
      router.push(`/onboarding?subscriptionId=${subscriptionCreated.subscription[0].id}`);
    } else {
      router.push("/pricing");
    }
  };

  const handleBackToPricing = () => {
    router.push("/pricing");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (subscriptionCreated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to QuickHR!
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your account and subscription have been created successfully. Your 14-day free trial has started!
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                What's Next?
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 text-left space-y-1">
                <li>• Check your email for account verification</li>
                <li>• Add payment details to continue after trial</li>
                <li>• Log in to access your dashboard</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleGoToDashboard}
                className="w-full"
              >
                Go to Login
              </Button>
              
              <Button
                variant="outline"
                onClick={handleBackToPricing}
                className="w-full"
              >
                Back to Pricing
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto p-6"
        >
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={handleBackToPricing}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Pricing
            </Button>
          </div>

          {!subscriptionCreated ? (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Complete Your Subscription
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Choose your plan and complete your subscription to get started
                </p>
              </div>

              <SubscriptionCreation
                availablePlans={availablePlans}
                initialPlanId={selectedPlanId}
                initialInterval={selectedInterval}
                onSuccess={handleSubscriptionSuccess}
                onCancel={handleBackToPricing}
              />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-md w-full"
            >
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome to QuickHR!
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your account and subscription have been created successfully. Your 14-day free trial has started!
                </p>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Subscription Details</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {availablePlans.find(p => p.id === selectedPlanId)?.name || 'Selected Plan'} - {selectedInterval}
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleGoToDashboard}
                    className="w-full"
                  >
                    Continue to Dashboard
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Success Dialog */}
      <ConfirmDialog
        open={showSuccessDialog}
        title="Subscription Created!"
        message={dialogMessage}
        confirmText="Continue to Setup"
        onConfirm={() => {
          setShowSuccessDialog(false);
          if (subscriptionCreated) {
            router.push(`/onboarding?subscriptionId=${subscriptionCreated.subscription[0].id}`);
          }
        }}
        onOpenChange={(open) => !open && setShowSuccessDialog(false)}
      />
    </>
  );
}

export default function PublicSubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto"></div>
        </div>
      </div>
    }>
      <PublicSubscriptionPageContent />
    </Suspense>
  );
}
