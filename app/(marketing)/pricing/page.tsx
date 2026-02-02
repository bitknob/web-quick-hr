"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X, Users, HardDrive, Settings, BarChart3, Plug, Shield, Headphones, Palette, Zap, Building2, Rocket, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { pricingApi } from "@/lib/api/pricing";
import { PricingPlan } from "@/lib/types/pricing";

// Define the plan interface used in the component
interface PlanCard {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: Array<{ name: string; included: boolean }>;
  cta: string;
  popular: boolean;
}

const faqs = [
  {
    question: "Can I change my plan later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual plans.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes! All plans come with a 14-day free trial. No credit card required to start.",
  },
  {
    question: "What happens when I exceed my employee limit?",
    answer:
      "We'll notify you when you're approaching your limit. You can upgrade your plan anytime to accommodate more employees.",
  },
  {
    question: "Do you offer discounts for nonprofits?",
    answer:
      "Yes, we offer a 30% discount for registered nonprofit organizations. Contact our sales team to learn more.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Absolutely. You can cancel your subscription at any time. Your access will continue until the end of your billing period.",
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [plans, setPlans] = useState<PlanCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPricingPlans = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const pricingPlans = await pricingApi.getPricingPlans(true);
        
        // Convert API plans to the format expected by the component
        const convertedPlans = pricingPlans.map((plan: PricingPlan) => ({
          id: plan.id.toString(),
          name: plan.name,
          icon: plan.name.toLowerCase() === 'professional' ? Rocket : 
                plan.name.toLowerCase() === 'enterprise' ? Building2 : Zap,
          description: plan.description,
          monthlyPrice: plan.monthlyPrice,
          yearlyPrice: plan.yearlyPrice,
          features: plan.features,
          cta: plan.name.toLowerCase() === 'enterprise' ? "Contact Sales" : "Start Free Trial",
          popular: plan.name.toLowerCase() === 'professional',
        }));
        
        setPlans(convertedPlans);
      } catch (err) {
        console.error('Failed to fetch pricing plans:', err);
        setError('Failed to load pricing plans. Please try again later.');
        setPlans([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricingPlans();
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="py-20 lg:py-28 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
              Choose the perfect plan for your team. All plans include a 14-day
              free trial with no credit card required.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span
                className={`text-sm font-medium ${
                  !isYearly
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Monthly
              </span>
              <Switch checked={isYearly} onCheckedChange={setIsYearly} />
              <span
                className={`text-sm font-medium ${
                  isYearly
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Yearly
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                  Save 17%
                </span>
              </span>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          {error && (
            <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">{error}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {isLoading ? (
              // Loading skeleton
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-sm animate-pulse"
                >
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-6 w-full"></div>
                    <div className="mb-6">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    </div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <div key={j} className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              plans.map((plan: PlanCard, index: number) => (
                <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 ${
                  plan.popular
                    ? "border-blue-600 dark:border-blue-500 shadow-xl"
                    : "border-gray-200 dark:border-gray-700 shadow-sm"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        plan.popular
                          ? "bg-blue-100 dark:bg-blue-900/30"
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      <plan.icon
                        className={`w-5 h-5 ${
                          plan.popular
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {plan.name}
                    </h3>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 h-12">
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      ₹{(isYearly ? plan.yearlyPrice : plan.monthlyPrice).toLocaleString('en-IN')}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      /{isYearly ? "year" : "month"}
                    </span>
                  </div>

                  <Link href={index < 2 ? `/subscription?plan=${plan.id}&interval=${isYearly ? 'yearly' : 'monthly'}` : '/contact'}>
                    <Button
                      className="w-full mb-6"
                      variant={plan.popular ? "default" : "secondary"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>

                  <ul className="space-y-3">
                    {plan.features.map((feature: { name: string; included: boolean }) => (
                      <li
                        key={feature.name}
                        className="flex items-center gap-3 text-sm"
                      >
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                        )}
                        <span
                          className={
                            feature.included
                              ? "text-gray-700 dark:text-gray-300"
                              : "text-gray-400 dark:text-gray-500"
                          }
                        >
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )))}
          </div>
        </div>
      </section>

      {/* Feature Comparison - Modern Card Design */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Compare Plans
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              See which plan is right for your organization.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Feature Names Column */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Features</h3>
                <div className="space-y-4">
                  {[
                    { icon: Users, name: "Employees" },
                    { icon: HardDrive, name: "Document Storage" },
                    { icon: Settings, name: "Custom Workflows" },
                    { icon: BarChart3, name: "Advanced Analytics" },
                    { icon: Plug, name: "API Access" },
                    { icon: Shield, name: "SSO Integration" },
                    { icon: Headphones, name: "Dedicated Support" },
                    { icon: Palette, name: "Custom Branding" },
                  ].map((feature) => (
                    <div key={feature.name} className="flex items-center gap-3">
                      <feature.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Plan Cards */}
            {plans.map((plan, planIndex) => (
              <div key={plan.id} className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: planIndex * 0.1 }}
                  className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${
                    plan.popular
                      ? "border-blue-600 dark:border-blue-500 shadow-lg" 
                      : plan.name.toLowerCase() === "enterprise"
                      ? "border-purple-600 dark:border-purple-500 shadow-lg"
                      : "border-gray-200 dark:border-gray-700"
                  } p-6 h-full`}
                >
                  <div className="text-center mb-6">
                    <h3 className={`text-lg font-bold ${
                      plan.popular ? "text-blue-600 dark:text-blue-400" : 
                      plan.name.toLowerCase() === "enterprise" ? "text-purple-600 dark:text-purple-400" : 
                      "text-gray-900 dark:text-white"
                    }`}>
                      {plan.name}
                    </h3>
                    {plan.popular && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mt-2">
                        Most Popular
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { feature: "Employees", getValue: () => plan.name === "Enterprise" ? "Unlimited" : plan.name === "Professional" ? "100" : "25" },
                      { feature: "Document Storage", getValue: () => plan.name === "Enterprise" ? "Unlimited" : plan.name === "Professional" ? "50GB" : "5GB" },
                      { feature: "Custom Workflows", getValue: () => plan.features.find(f => f.name.includes("workflows"))?.included || false },
                      { feature: "Advanced Analytics", getValue: () => plan.features.find(f => f.name.includes("analytics"))?.included || false },
                      { feature: "API Access", getValue: () => plan.features.find(f => f.name.includes("API"))?.included || false },
                      { feature: "SSO Integration", getValue: () => plan.features.find(f => f.name.includes("SSO"))?.included || false },
                      { feature: "Dedicated Support", getValue: () => plan.features.find(f => f.name.includes("support"))?.included || false },
                      { feature: "Custom Branding", getValue: () => plan.features.find(f => f.name.includes("branding"))?.included || false },
                    ].map((item, index) => (
                      <div key={index} className="flex justify-center items-center min-h-[40px]">
                        {typeof item.getValue() === "boolean" ? (
                          item.getValue() ? (
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            </div>
                          )
                        ) : (
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {item.getValue()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Link href={plan.name.toLowerCase() === "enterprise" ? '/contact' : `/subscription?plan=${planIndex + 1}&interval=${isYearly ? 'yearly' : 'monthly'}`}>
                      <Button
                        className="w-full"
                        variant={plan.popular ? "default" : plan.name.toLowerCase() === "enterprise" ? "outline" : "secondary"}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Have questions? We have answers.
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-blue-100 mb-8">
              Start your 14-day free trial today. No credit card required.
            </p>
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-lg font-medium shadow-lg transition-all duration-200"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
