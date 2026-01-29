"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubscriptionCreation } from "@/components/subscriptions/subscription-creation";
import { useToast } from "@/components/ui/toast";
import { ArrowLeft, CreditCard, BarChart3 } from "lucide-react";

function PublicSubscriptionPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<"monthly" | "yearly">("monthly");
  const [subscriptionCreated, setSubscriptionCreated] = useState<any>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchPricingPlans = async () => {
      try {
        // Use mock data for now since backend API is not implemented
        const mockPlans = [
          {
            id: 1,
            name: "Starter",
            monthlyPrice: 999,
            yearlyPrice: 9999,
            features: [
              { name: "25 Employees", included: true },
              { name: "5GB Document Storage", included: true },
              { name: "Custom Workflows", included: false },
              { name: "Advanced Analytics", included: false },
              { name: "API Access", included: false },
              { name: "SSO Integration", included: false },
              { name: "Dedicated Support", included: false },
              { name: "Custom Branding", included: false },
            ]
          },
          {
            id: 2,
            name: "Professional",
            monthlyPrice: 2999,
            yearlyPrice: 29999,
            features: [
              { name: "100 Employees", included: true },
              { name: "50GB Document Storage", included: true },
              { name: "Custom Workflows", included: true },
              { name: "Advanced Analytics", included: true },
              { name: "API Access", included: false },
              { name: "SSO Integration", included: false },
              { name: "Dedicated Support", included: false },
              { name: "Custom Branding", included: false },
            ]
          },
          {
            id: 3,
            name: "Enterprise",
            monthlyPrice: 9999,
            yearlyPrice: 99999,
            features: [
              { name: "Unlimited Employees", included: true },
              { name: "Unlimited Document Storage", included: true },
              { name: "Custom Workflows", included: true },
              { name: "Advanced Analytics", included: true },
              { name: "API Access", included: true },
              { name: "SSO Integration", included: true },
              { name: "Dedicated Support", included: true },
              { name: "Custom Branding", included: true },
            ]
          }
        ];
        setAvailablePlans(mockPlans);

        // Parse URL parameters after plans are loaded
        const plan = searchParams.get("plan");
        const interval = searchParams.get("interval");
        
        // Handle both string names and numeric IDs
        if (plan) {
          // If it's a string name, find the corresponding plan
          if (isNaN(Number(plan))) {
            const foundPlan = mockPlans.find(p => p.name.toLowerCase() === plan.toLowerCase());
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
    setSubscriptionCreated(subscription);
    addToast({
      title: "Success",
      description: "Account and subscription created successfully!",
      variant: "success",
    });
  };

  const handleGoToDashboard = () => {
    // Redirect to login page after successful subscription
    router.push("/login?message=subscription_created");
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        {/* Header */}
        <div className="mb-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="outline"
              onClick={handleBackToPricing}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Pricing
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Start Your Free Trial
            </h1>
            <div className="w-[140px]"></div> {/* Spacer for balance */}
          </div>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Create your account and start using QuickHR immediately
            </p>
          </div>
        </div>

        {/* Subscription Creation */}
        <div className="max-w-4xl mx-auto">
          {/* Selected Plan Summary */}
          {selectedPlanId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      You've selected the {availablePlans.find(p => p.id === selectedPlanId)?.name || 'Starter'} plan
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedInterval === 'yearly' ? 'Yearly billing - Save 17%' : 'Monthly billing'} • 
                      ₹{(availablePlans.find(p => p.id === selectedPlanId)?.[selectedInterval === 'yearly' ? 'yearlyPrice' : 'monthlyPrice'] || 0).toLocaleString('en-IN')}/{selectedInterval}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleBackToPricing}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Change Plan
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          <SubscriptionCreation
            availablePlans={availablePlans}
            initialPlanId={selectedPlanId}
            initialInterval={selectedInterval}
            onSuccess={handleSubscriptionSuccess}
            onCancel={handleBackToPricing}
          />
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 6.048c0 5.852 4.946 10.639 10.639 10.639.057 0 .109-.005.164-.015.353-.014.547-.014.698 0 .115.009.21.01.327.005.196.01.415.014.647.048.196.09.43.13.668.047.317.076.637.13.975.192.415.4.76.425 1.175.265.35.549.54.838.52.292-.003.583-.01.868-.02 1.179-.03.324-.006.648-.016.974-.027.15-.003.311-.006.622-.018.928-.037.216-.008.424-.016.847-.023 1.259-.034.088-.003.176-.006.264-.01.39-.007.134-.015.27-.022.405-.007.15-.015.3-.022.45-.03.15-.046-.3-.08-.46-.013-.06-.015-.12-.023-.18-.035-.06-.11-.138-.195-.288-.434-.12-.207-.24-.406-.594-.667-.14-.14-.28-.254-.425-.346-.105-.07-.204-.138-.285-.015-.06-.024-.12-.034-.18-.015-.06-.023-.12-.034-.18-.09-.49-.255-.876-.404-.178-.09-.358-.17-.538-.25-.08-.04-.173-.08-.349-.143-.215-.06-.432-.12-.647-.18-.19-.007-.376-.014-.564-.02-.29-.01-.58-.02-.869-.03-.187-.01-.375-.02-.562-.03-.29-.01-.581-.02-.87-.04-.188-.01-.376-.03-.564-.05-.29-.02-.58-.03-.86-.05-.182-.01-.363-.02-.546-.04-.182-.01-.364-.02-.546-.04-.09-.01-.176-.015-.263-.022-.09-.01-.175-.02-.263-.03-.27-.01-.54-.02-.8-.03-1.2-.04-.182-.01-.363-.01-.545-.02-.182 0-.364.01-.545.02-.182.01-.364.01-.545.02.09.01.176.01.263.02.09.01.175.02.263.03.27.01.54.02.8.03 1.2.04.182.01.363.02.545.03.182.01.364.02.546.03.09.01.175.02.263.02.09.01.176.02.263.03.27.01.54.02.8.03 1.2.04z" clipRule="evenodd" />
              </svg>
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 8a1 1 0 001.424 1.424L8.586 10l-1.293 1.293a1 1 0 00-1.414 1.414L10.586 12l-7.071 7.071a1 1 0 001.414 0l7-8a1 1 0 00-.216-1.084z" />
                <path d="M12 8a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
              <span>14-Day Trial</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2H4zm6 2a1 1 0 011 0h2a1 1 0 110-2h-2z" clipRule="evenodd" />
              </svg>
              <span>No Credit Card Required</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
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
