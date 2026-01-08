"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id");
  const plan = searchParams.get("plan");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700 shadow-lg"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Thank you for your purchase. Your {plan ? `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan` : "subscription"} is now active.
        </p>

        {paymentId && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Payment ID</p>
            <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
              {paymentId}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link href="/signup" className="block">
            <Button className="w-full" size="lg">
              Create Your Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Set up your account to start using Quick HR
          </p>
        </div>
      </motion.div>
    </div>
  );
}
