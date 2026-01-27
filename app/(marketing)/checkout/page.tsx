"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Zap, Rocket, Building2, Shield, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  modal?: {
    ondismiss: () => void;
  };
}

const plans = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    description: "Perfect for small teams getting started with HR management.",
    monthlyPrice: 2499,
    yearlyPrice: 24990,
    features: [
      "Up to 25 employees",
      "Employee directory",
      "Leave management",
      "Basic attendance tracking",
      "Email support",
      "Document storage (5GB)",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    icon: Rocket,
    description: "For growing companies that need more power and flexibility.",
    monthlyPrice: 6499,
    yearlyPrice: 64990,
    features: [
      "Up to 100 employees",
      "Everything in Starter",
      "Advanced attendance tracking",
      "Priority email & chat support",
      "Document storage (50GB)",
      "Custom workflows",
      "Advanced analytics",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building2,
    description: "For large organizations with complex HR requirements.",
    monthlyPrice: 16499,
    yearlyPrice: 164990,
    features: [
      "Unlimited employees",
      "Everything in Professional",
      "24/7 dedicated support",
      "Unlimited document storage",
      "API access",
      "SSO integration",
      "Custom branding",
    ],
  },
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const { addToast } = useToast();
  
  const [selectedPlan, setSelectedPlan] = useState(planParam || "professional");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const currentPlan = plans.find((p) => p.id === selectedPlan) || plans[1];
  const price = billingCycle === "yearly" ? currentPlan.yearlyPrice : currentPlan.monthlyPrice;

    const handlePayment = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      addToast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "error",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create Order
      const orderResponse = await apiClient.post<any>("/api/payments/orders", {
        amount: price, // Sending major unit (Rupees)
        currency: "INR",
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        notes: {
          plan: selectedPlan,
          billing_cycle: billingCycle,
          company: formData.company,
        },
      });

      // Handle response structure depending on whether it follows ApiResponse or the direct structure
      // Based on user doc: { success: true, data: { order: ..., keyId: ... } }
      // But if it goes through gateway it might return { header: ..., response: { ... } }
      // We will check for 'data' or 'response' property to be safe, or just trust the response.
      // Based on typical behavior, apiClient returns the body.
      const orderData = (orderResponse as any).data || orderResponse.response;

      if (!orderData || !orderData.order) {
        throw new Error("Invalid order data received from server");
      }

      const keyId = orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!keyId) {
          console.error("Missing Razorpay Key ID in response or env");
          addToast({
            title: "Configuration Error",
            description: "Missing Payment Gateway Key",
            variant: "error",
          });
          setIsProcessing(false);
          return;
      }

      const options = {
        key: keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Quick HR",
        description: `${currentPlan.name} Plan - ${billingCycle === "yearly" ? "Yearly" : "Monthly"}`,
        image: "/logo.png",
        order_id: orderData.order.id, // This is key for backend integration
        handler: async function (response: RazorpayResponse) {
          try {
            // 2. Verify Payment
            await apiClient.post("/api/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Redirect on success
            window.location.href = `/checkout/success?payment_id=${response.razorpay_payment_id}&plan=${selectedPlan}`;
          } catch (verifyError) {
            console.error("Verification failed:", verifyError);
            addToast({
              title: "Payment Verification Failed",
              description: "Please contact support for assistance.",
              variant: "error",
            });
            setIsProcessing(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          plan: selectedPlan,
          billing_cycle: billingCycle,
          company: formData.company,
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment initialization failed:", error);
      addToast({
        title: "Payment Initialization Failed",
        description: "Failed to initialize payment. Please try again.",
        variant: "error",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Complete Your Purchase
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Select your plan and complete payment to get started
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plan Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Billing Cycle Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Billing Cycle
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    billingCycle === "monthly"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium">Monthly</div>
                  <div className="text-sm opacity-75">Billed monthly</div>
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all relative ${
                    billingCycle === "yearly"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Save 17%
                  </span>
                  <div className="font-medium">Yearly</div>
                  <div className="text-sm opacity-75">Billed annually</div>
                </button>
              </div>
            </motion.div>

            {/* Plan Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Select Plan
              </h2>
              <div className="space-y-3">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedPlan === plan.id
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            selectedPlan === plan.id
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          <plan.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {plan.name}
                            </span>
                            {plan.popular && (
                              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {plan.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 dark:text-white">
                          ₹{(billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice).toLocaleString("en-IN")}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          /{billingCycle === "yearly" ? "year" : "month"}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Acme Inc."
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 sticky top-24"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <currentPlan.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {currentPlan.name} Plan
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {billingCycle === "yearly" ? "Annual" : "Monthly"} billing
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {currentPlan.features.slice(0, 5).map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="w-4 h-4 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>₹{price.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>GST (18%)</span>
                  <span>₹{Math.round(price * 0.18).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
                  <span>₹{Math.round(price * 1.18).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                isLoading={isProcessing}
                className="w-full mt-6"
                size="lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pay with Razorpay
              </Button>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Shield className="w-4 h-4" />
                Secure payment powered by Razorpay
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
