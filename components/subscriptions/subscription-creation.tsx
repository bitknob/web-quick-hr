"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import { PasswordInput } from "@/components/ui/password-strength";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { 
  CheckCircle, 
  Shield,
  Zap
} from "lucide-react";
import { CreateSubscriptionRequest, CreateSubscriptionResponse } from "@/lib/types/subscription";
import { subscriptionApi } from "@/lib/api/subscriptions";

const subscriptionSchema = z.object({
  pricingPlanId: z.number().min(1, "Please select a pricing plan"),
  interval: z.enum(["monthly", "yearly"]),
  firstName: z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be less than 50 characters"),
  personalEmail: z.string().email("Please enter a valid personal email address"),
  companyEmail: z.string().email("Please enter a valid company email address"),
  companyName: z.string().min(1, "Company name is required").max(100, "Company name must be less than 100 characters"),
  companyCode: z.string().min(2, "Company code must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  contact: z.string().min(10, "Contact number must be at least 10 digits").regex(/^[+]?[\d\s-()]+$/, "Please enter a valid contact number"),
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
  initialPlanId?: number;
  initialInterval?: "monthly" | "yearly";
  onSuccess?: (subscription: CreateSubscriptionResponse) => void;
  onCancel?: () => void;
  createAccount?: boolean;
}

export default function SubscriptionCreation({
  availablePlans, 
  initialPlanId,
  initialInterval,
  onSuccess, 
  onCancel,
  createAccount = false
}: SubscriptionCreationProps) {
  const [loading, setLoading] = useState(false);
  const [createdSubscription, setCreatedSubscription] = useState<CreateSubscriptionResponse | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

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
      firstName: "",
      lastName: "",
      personalEmail: "",
      companyEmail: "",
      companyName: "",
      companyCode: "",
      password: "",
      contact: "",
    },
  });

  const selectedPlanId = watch("pricingPlanId");
  const selectedInterval = watch("interval");
  const selectedPlan = availablePlans.find(plan => plan.id === selectedPlanId);

  const onSubmit = async (data: SubscriptionFormData) => {
    try {
      setLoading(true);

      // Create subscription with the new API structure
      const subscriptionData: CreateSubscriptionRequest = {
        pricingPlanId: data.pricingPlanId,
        customerData: {
          name: `${data.firstName} ${data.lastName}`,
          personalEmail: data.personalEmail,
          companyEmail: data.companyEmail,
          companyName: data.companyName,
          companyCode: data.companyCode,
          firstName: data.firstName,
          lastName: data.lastName,
          password: data.password,
          contact: data.contact,
        },
        interval: data.interval,
      };

      const validationErrors = subscriptionApi.validateSubscriptionData(subscriptionData);
      if (validationErrors.length > 0) {
        setDialogMessage(validationErrors.join(", "));
        setShowErrorDialog(true);
        return;
      }

      // Create subscription using the updated API
      const response = await subscriptionApi.createSubscription(subscriptionData);
      setCreatedSubscription(response);

      setDialogMessage("Subscription created with 14-day free trial");
      setShowSuccessDialog(true);

      // Pass both subscription response and customer data to success callback
      onSuccess?.({
        ...response,
        customerData: subscriptionData.customerData
      });
    } catch (error) {
      console.error("Failed to create subscription:", error);
      setDialogMessage("Failed to create subscription. Please try again.");
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
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
            Subscription Created!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your 14-day free trial has started. You can start using all features immediately.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Trial Details
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Trial ends on {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          </div>
          <Button onClick={() => onSuccess?.(createdSubscription)}>
            Continue to Dashboard
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Complete Your Subscription
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Fill in your details to start your free trial
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Plan Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Selected Plan
              </h3>
              {selectedPlan ? (
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {selectedPlan.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedInterval === "monthly" ? "Monthly" : "Yearly"} billing
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatPrice(
                          selectedInterval === "monthly" 
                            ? selectedPlan.monthlyPrice 
                            : selectedPlan.yearlyPrice
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedInterval === "monthly" ? "/month" : "/year"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-red-300 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                  <p className="text-red-600 dark:text-red-400">
                    Please select a plan to continue
                  </p>
                </div>
              )}
              <input
                type="hidden"
                {...register("pricingPlanId")}
                value={selectedPlanId}
              />
              <input
                type="hidden"
                {...register("interval")}
                value={selectedInterval}
              />
            </div>

            {/* Customer Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Account Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name *
                  </label>
                  <Input
                    {...register("firstName")}
                    placeholder="John"
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name *
                  </label>
                  <Input
                    {...register("lastName")}
                    placeholder="Doe"
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Personal Email *
                  </label>
                  <Input
                    {...register("personalEmail")}
                    type="email"
                    placeholder="john@gmail.com"
                    className={errors.personalEmail ? "border-red-500" : ""}
                  />
                  {errors.personalEmail && (
                    <p className="text-red-500 text-xs mt-1">{errors.personalEmail.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">For your account login (gmail, yahoo, etc.)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Email *
                  </label>
                  <Input
                    {...register("companyEmail")}
                    type="email"
                    placeholder="john@company.com"
                    className={errors.companyEmail ? "border-red-500" : ""}
                  />
                  {errors.companyEmail && (
                    <p className="text-red-500 text-xs mt-1">{errors.companyEmail.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">For business operations</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Name *
                  </label>
                  <Input
                    {...register("companyName")}
                    placeholder="Acme Corporation"
                    className={errors.companyName ? "border-red-500" : ""}
                  />
                  {errors.companyName && (
                    <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Code *
                  </label>
                  <Input
                    {...register("companyCode")}
                    placeholder="ACME2024"
                    className={errors.companyCode ? "border-red-500" : ""}
                  />
                  {errors.companyCode && (
                    <p className="text-red-500 text-xs mt-1">{errors.companyCode.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Unique company identifier (min. 2 characters, no maximum limit)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password *
                  </label>
                  <PasswordInput
                    value={watch("password")}
                    onChange={(value) => setValue("password", value)}
                    placeholder="Create a strong password"
                    error={errors.password?.message}
                    showStrengthMeter={true}
                    showRequirements={true}
                    id="password"
                  />
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
                      {...register("contact")}
                      placeholder="98765 43210"
                      className={`rounded-l-none ${errors.contact ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.contact && (
                    <p className="text-red-500 text-xs mt-1">{errors.contact.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Trial Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                14-Day Free Trial
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Start using all features immediately. Your trial will end on{" "}
                {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1"
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

      {/* Success Dialog */}
      <ConfirmDialog
        open={showSuccessDialog}
        title="Success!"
        message={dialogMessage}
        confirmText="OK"
        onConfirm={() => setShowSuccessDialog(false)}
        onOpenChange={(open) => !open && setShowSuccessDialog(false)}
      />

      {/* Error Dialog */}
      <ConfirmDialog
        open={showErrorDialog}
        title="Error"
        message={dialogMessage}
        confirmText="OK"
        onConfirm={() => setShowErrorDialog(false)}
        onOpenChange={(open) => !open && setShowErrorDialog(false)}
      />
    </>
  );
}
