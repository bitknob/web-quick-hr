"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import { CreditCard, ExternalLink, AlertTriangle } from "lucide-react";
import { CreateSubscriptionResponse, CustomerData } from "@/lib/types/subscription";
import { subscriptionApi } from "@/lib/api/subscriptions";
import { useToast } from "@/components/ui/toast";

interface RazorpayPaymentProps {
  subscription: CreateSubscriptionResponse;
  customerData: CustomerData;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  image: string;
  amount: number;
  currency: string;
  handler: (response: { 
    razorpay_payment_id: string; 
    razorpay_subscription_id: string; 
    razorpay_signature: string 
  }) => void;
  modal: {
    ondismiss: () => void;
    escape: boolean;
    backdropclose: boolean;
    handleback: boolean;
    confirm_close: boolean;
    animation: string;
  };
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    company_id: string;
    plan_id: number;
    plan_name?: string;
  };
  theme: {
    color: string;
    backdrop_color: string;
  };
  config: {
    display: {
      blocks: {
        banks: {
          visible: boolean;
        };
        upi: {
          visible: boolean;
          prefered: boolean;
        };
        wallet: {
          visible: boolean;
        };
        paylater: {
          visible: boolean;
        };
        cardlesscredit: {
          visible: boolean;
        };
        ach: {
          visible: boolean;
        };
        app: {
          visible: boolean;
        };
      };
    };
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

export function RazorpayPayment({ 
  subscription, 
  customerData, 
  onSuccess, 
  onError, 
  onCancel 
}: RazorpayPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => {
      addToast({
        title: "Error",
        description: "Failed to load payment gateway",
        variant: "error",
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [addToast]);

  const handlePayment = () => {
    if (!razorpayLoaded || !window.Razorpay) {
      addToast({
        title: "Error",
        description: "Payment gateway not loaded",
        variant: "error",
      });
      return;
    }

    setLoading(true);

    const options: RazorpayOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      subscription_id: subscription.subscription.id.toString(),
      name: customerData.name,
      description: `Subscription for HRM Service`,
      image: "/logo.png",
      amount: subscription.subscription.amount * 100, // Razorpay expects amount in paise
      currency: subscription.subscription.currency,
      handler: function (response: { 
        razorpay_payment_id: string; 
        razorpay_subscription_id: string; 
        razorpay_signature: string 
      }) {
        console.log("Payment successful:", response);
        addToast({
          title: "Success",
          description: "Payment completed successfully",
          variant: "success",
        });
        onSuccess?.(response.razorpay_payment_id);
        setLoading(false);
      },
      modal: {
        ondismiss: function() {
          console.log("Payment modal dismissed");
          setLoading(false);
          onCancel?.();
        },
        escape: true,
        backdropclose: false,
        handleback: true,
        confirm_close: true,
        animation: "slideFromBottom",
      },
      prefill: {
        name: customerData.name,
        email: customerData.email,
        contact: customerData.contact,
      },
      notes: {
        company_id: subscription.subscription.companyId,
        plan_id: subscription.subscription.pricingPlanId,
      },
      theme: {
        color: "#3399cc",
        backdrop_color: "#ffffff",
      },
      config: {
        display: {
          blocks: {
            banks: {
              visible: false,
            },
            upi: {
              visible: true,
              prefered: true,
            },
            wallet: {
              visible: false,
            },
            paylater: {
              visible: false,
            },
            cardlesscredit: {
              visible: false,
            },
            ach: {
              visible: false,
            },
            app: {
              visible: false,
            },
          },
        },
      },
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Razorpay error:", error);
      addToast({
        title: "Error",
        description: "Failed to initialize payment",
        variant: "error",
      });
      onError?.("Failed to initialize payment");
      setLoading(false);
    }
  };

  const handlePaymentLinkRedirect = () => {
    if (subscription.paymentLink?.short_url) {
      window.open(subscription.paymentLink.short_url, "_blank");
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Complete Your Subscription
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add your payment details to activate your subscription and continue enjoying all features.
          </p>
        </div>

        {/* Subscription Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Subscription Summary
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Plan ID:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {subscription.subscription.pricingPlanId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Billing:</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {subscription.subscription.interval}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Amount:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {subscriptionApi.formatAmount(subscription.subscription.amount, subscription.subscription.currency)}
                /{subscription.subscription.interval}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Trial Period:</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {subscription.trialDays} days free
              </span>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="space-y-3">
          <Button
            onClick={handlePayment}
            disabled={loading || !razorpayLoaded}
            className="w-full"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay with Razorpay
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handlePaymentLinkRedirect}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Payment Link
          </Button>
        </div>

        {/* Security Information */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
            </div>
            <span>Secure payment powered by Razorpay</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Your payment information is encrypted and secure. We never store your card details.
          </p>
        </div>

        {/* Payment Methods */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Accepted Payment Methods
          </h4>
          <div className="flex gap-2">
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-700 dark:text-gray-300">
              UPI
            </div>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-700 dark:text-gray-300">
              Cards
            </div>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-700 dark:text-gray-300">
              NetBanking
            </div>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-700 dark:text-gray-300">
              Wallet
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Important Information
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Your 14-day free trial starts after successful payment setup</li>
                <li>• You can cancel your subscription anytime</li>
                <li>• No refunds for partial billing periods</li>
                <li>• Subscription auto-renews by default</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
