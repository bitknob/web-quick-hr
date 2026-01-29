"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  Shield,
  Zap
} from "lucide-react";
import { CreateSubscriptionRequest, CreateSubscriptionResponse } from "@/lib/types/subscription";
import { subscriptionApi } from "@/lib/api/subscriptions";
import { useToast } from "@/components/ui/toast";

const subscriptionSchema = z.object({
  pricingPlanId: z.number().min(1, "Please select a pricing plan"),
  interval: z.enum(["monthly", "yearly"]),
  customerName: z.string().min(1, "Customer name is required").max(100, "Name must be less than 100 characters"),
  customerEmail: z.string().email("Please enter a valid email address"),
  customerContact: z.string().min(10, "Contact number must be at least 10 digits").regex(/^[+]?[\d\s-()]+$/, "Please enter a valid contact number"),
  companyName: z.string().min(1, "Company name is required").max(100, "Company name must be less than 100 characters"),
  billingAddress: z.string().min(5, "Billing address is required").max(200, "Billing address must be less than 200 characters"),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

interface SubscriptionCreationProps {
  availablePlans: Array<{
    id: number;
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: Array<{ name: string; included: boolean }>;
  }>;
  initialPlanId?: number | null;
  initialInterval?: "monthly" | "yearly";
  onSuccess?: (subscription: CreateSubscriptionResponse) => void;
  onCancel?: () => void;
  createAccount?: boolean;
}

export function SubscriptionCreation({ 
  availablePlans, 
  initialPlanId,
  initialInterval,
  onSuccess, 
  onCancel,
  createAccount = false
}: SubscriptionCreationProps) {
  const [loading, setLoading] = useState(false);
  const [createdSubscription, setCreatedSubscription] = useState<CreateSubscriptionResponse | null>(null);
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      pricingPlanId: initialPlanId || 0,
      interval: initialInterval || "monthly",
      customerName: "",
      customerEmail: "",
      customerContact: "",
    },
  });

  const selectedPlanId = watch("pricingPlanId");
  const selectedInterval = watch("interval");
  const selectedPlan = availablePlans.find(plan => plan.id === selectedPlanId);

  const onSubmit = async (data: SubscriptionFormData) => {
    try {
      setLoading(true);

      // For new user signups, we need to create a company first
      // For now, we'll use a placeholder companyId
      // TODO: Backend needs to implement company creation endpoint or accept company data in subscription request
      const tempCompanyId = `new-company-${Date.now()}`;

      // Create subscription with the companyId
      const subscriptionData: CreateSubscriptionRequest = {
        companyId: tempCompanyId,
        pricingPlanId: data.pricingPlanId,
        customerData: {
          name: data.customerName,
          email: data.customerEmail,
          contact: data.customerContact,
        },
        interval: data.interval,
      };

      const validationErrors = subscriptionApi.validateSubscriptionData(subscriptionData);
      if (validationErrors.length > 0) {
        addToast({
          title: "Validation Error",
          description: validationErrors.join(", "),
          variant: "error",
        });
        return;
      }

      // Create subscription using the existing API
      const response = await subscriptionApi.createSubscription(subscriptionData);
      setCreatedSubscription(response);

      addToast({
        title: "Success",
        description: "Subscription created with 14-day free trial",
        variant: "success",
      });

      onSuccess?.(response);
    } catch (error) {
      console.error("Failed to create subscription:", error);
      addToast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentRedirect = () => {
    if (createdSubscription?.paymentLink?.short_url) {
      window.open(createdSubscription.paymentLink.short_url, '_blank');
    }
  };

  const getPlanPrice = (plan: {
    id: number;
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: Array<{ name: string; included: boolean }>;
  }, interval: string) => {
    if (!plan) return 0;
    return interval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getYearlySavings = (plan: {
    id: number;
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: Array<{ name: string; included: boolean }>;
  }) => {
    if (!plan) return 0;
    const yearlyMonthly = plan.yearlyPrice / 12;
    const savings = ((plan.monthlyPrice - yearlyMonthly) / plan.monthlyPrice) * 100;
    return Math.round(savings);
  };

  if (createdSubscription) {
    return (
      <Card className="max-w-2xl mx-auto">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Subscription Created Successfully!
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your 14-day free trial has started. Add your payment details to continue service after the trial ends.
          </p>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Subscription Details
            </h3>
            <div className="space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                <span className="font-medium">{selectedPlan?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Billing:</span>
                <span className="font-medium capitalize">{selectedInterval}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Trial Period:</span>
                <span className="font-medium">14 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Trial Ends:</span>
                <span className="font-medium">
                  {subscriptionApi.formatDate(createdSubscription.trialEndDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="font-medium">
                  {formatPrice(getPlanPrice(selectedPlan || { id: 0, name: '', monthlyPrice: 0, yearlyPrice: 0, features: [] }, selectedInterval))}/{selectedInterval}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handlePaymentRedirect}
              className="flex-1"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
            >
              Close
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Start Your Free Trial
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get 14 days of full access to all features. No credit card required to start.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Zap className="w-4 h-4" />
            <span>14-day free trial • Cancel anytime</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Selected Plan Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Selected Plan
            </label>
            <div className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              {selectedPlan && (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {selectedPlan.name}
                      {selectedPlan.name.toLowerCase().includes("professional") && (
                        <Badge className="ml-2 bg-blue-600 text-white text-xs">
                          Popular
                        </Badge>
                      )}
                    </h3>
                    
                    <div className="mb-3">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(getPlanPrice(selectedPlan, selectedInterval))}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">/{selectedInterval}</span>
                      
                      {selectedInterval === "yearly" && (
                        <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Save {getYearlySavings(selectedPlan)}% with yearly billing
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      {selectedPlan.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {feature.included ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <div className="w-3 h-3 border border-gray-300 rounded-full" />
                          )}
                          <span className={feature.included ? "text-gray-700 dark:text-gray-300" : "text-gray-400"}>
                            {feature.name}
                          </span>
                        </div>
                      ))}
                      {selectedPlan.features.length > 3 && (
                        <div className="text-sm text-gray-500">
                          +{selectedPlan.features.length - 3} more features
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Hidden field to store the selected plan */}
              <input
                type="hidden"
                {...register("pricingPlanId")}
                value={selectedPlanId}
              />
            </div>
          </div>

          {/* Billing Interval Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Billing Interval
            </label>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-900 dark:text-white font-medium capitalize">
                  {selectedInterval}
                </span>
                {selectedInterval === "yearly" && (
                  <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs">
                    Save 17%
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Hidden field to store the selected interval */}
            <input
              type="hidden"
              {...register("interval")}
              value={selectedInterval}
            />
          </div>

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Customer Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <Input
                  {...register("customerName")}
                  placeholder="John Doe"
                  className={errors.customerName ? "border-red-500" : ""}
                />
                {errors.customerName && (
                  <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address *
                </label>
                <Input
                  {...register("customerEmail")}
                  type="email"
                  placeholder="john@example.com"
                  className={errors.customerEmail ? "border-red-500" : ""}
                />
                {errors.customerEmail && (
                  <p className="text-red-500 text-xs mt-1">{errors.customerEmail.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company Name *
                </label>
                <Input
                  {...register("companyName")}
                  placeholder="Acme Corp"
                  className={errors.companyName ? "border-red-500" : ""}
                />
                {errors.companyName && (
                  <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-md">
                    +91
                  </span>
                  <Input
                    {...register("customerContact")}
                    placeholder="98765 43210"
                    className={`rounded-l-none ${errors.customerContact ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.customerContact && (
                  <p className="text-red-500 text-xs mt-1">{errors.customerContact.message}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Billing Address
              </label>
              <Input
                {...register("billingAddress")}
                placeholder="123 Main St, City, State 12345"
                className={errors.billingAddress ? "border-red-500" : ""}
              />
              {errors.billingAddress && (
                <p className="text-red-500 text-xs mt-1">{errors.billingAddress.message}</p>
              )}
            </div>
          </div>

          {/* Trial Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              14-Day Free Trial
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Start using all features immediately. Your trial will end on{" "}
              {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}. No payment required during trial.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating Subscription...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Start Free Trial
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}

export default SubscriptionCreation;
