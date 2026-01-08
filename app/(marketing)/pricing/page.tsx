"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X, Zap, Building2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const plans = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    description: "Perfect for small teams getting started with HR management.",
    monthlyPrice: 2499,
    yearlyPrice: 24990,
    features: [
      { name: "Up to 25 employees", included: true },
      { name: "Employee directory", included: true },
      { name: "Leave management", included: true },
      { name: "Basic attendance tracking", included: true },
      { name: "Email support", included: true },
      { name: "Document storage (5GB)", included: true },
      { name: "Custom workflows", included: false },
      { name: "Advanced analytics", included: false },
      { name: "API access", included: false },
      { name: "SSO integration", included: false },
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    id: "professional",
    name: "Professional",
    icon: Rocket,
    description: "For growing companies that need more power and flexibility.",
    monthlyPrice: 6499,
    yearlyPrice: 64990,
    features: [
      { name: "Up to 100 employees", included: true },
      { name: "Employee directory", included: true },
      { name: "Leave management", included: true },
      { name: "Advanced attendance tracking", included: true },
      { name: "Priority email & chat support", included: true },
      { name: "Document storage (50GB)", included: true },
      { name: "Custom workflows", included: true },
      { name: "Advanced analytics", included: true },
      { name: "API access", included: false },
      { name: "SSO integration", included: false },
    ],
    cta: "Start Free Trial",
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
      { name: "Unlimited employees", included: true },
      { name: "Employee directory", included: true },
      { name: "Leave management", included: true },
      { name: "Advanced attendance tracking", included: true },
      { name: "24/7 dedicated support", included: true },
      { name: "Unlimited document storage", included: true },
      { name: "Custom workflows", included: true },
      { name: "Advanced analytics", included: true },
      { name: "API access", included: true },
      { name: "SSO integration", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

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
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  isYearly ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    isYearly ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
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

                  <Link href={`/checkout?plan=${plan.id}`}>
                    <Button
                      className={`w-full mb-6 ${
                        plan.popular
                          ? ""
                          : "bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 dark:text-gray-900"
                      }`}
                      variant={plan.popular ? "default" : "secondary"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
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
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-x-auto"
          >
            <table className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-6 text-gray-900 dark:text-white font-semibold">
                    Feature
                  </th>
                  <th className="text-center py-4 px-6 text-gray-900 dark:text-white font-semibold">
                    Starter
                  </th>
                  <th className="text-center py-4 px-6 text-gray-900 dark:text-white font-semibold bg-blue-50 dark:bg-blue-900/20">
                    Professional
                  </th>
                  <th className="text-center py-4 px-6 text-gray-900 dark:text-white font-semibold">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Employees", starter: "25", pro: "100", enterprise: "Unlimited" },
                  { feature: "Document Storage", starter: "5GB", pro: "50GB", enterprise: "Unlimited" },
                  { feature: "Custom Workflows", starter: false, pro: true, enterprise: true },
                  { feature: "Advanced Analytics", starter: false, pro: true, enterprise: true },
                  { feature: "API Access", starter: false, pro: false, enterprise: true },
                  { feature: "SSO Integration", starter: false, pro: false, enterprise: true },
                  { feature: "Dedicated Support", starter: false, pro: false, enterprise: true },
                  { feature: "Custom Branding", starter: false, pro: false, enterprise: true },
                ].map((row, index) => (
                  <tr
                    key={row.feature}
                    className={
                      index % 2 === 0
                        ? "bg-gray-50 dark:bg-gray-900/30"
                        : "bg-white dark:bg-gray-800"
                    }
                  >
                    <td className="py-4 px-6 text-gray-700 dark:text-gray-300">
                      {row.feature}
                    </td>
                    <td className="text-center py-4 px-6">
                      {typeof row.starter === "boolean" ? (
                        row.starter ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-700 dark:text-gray-300">
                          {row.starter}
                        </span>
                      )}
                    </td>
                    <td className="text-center py-4 px-6 bg-blue-50 dark:bg-blue-900/20">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-700 dark:text-gray-300">
                          {row.pro}
                        </span>
                      )}
                    </td>
                    <td className="text-center py-4 px-6">
                      {typeof row.enterprise === "boolean" ? (
                        row.enterprise ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-700 dark:text-gray-300">
                          {row.enterprise}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
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
