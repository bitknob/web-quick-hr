"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { motion } from "framer-motion";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, hasHydrated, checkAuth } = useAuthStore();

  useEffect(() => {
    // Only check auth after hydration is complete
    if (hasHydrated) {
      checkAuth();
    }
  }, [hasHydrated, checkAuth]);

  useEffect(() => {
    // Only redirect after hydration is complete and we've confirmed user is not authenticated
    if (hasHydrated && !isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [hasHydrated, isLoading, isAuthenticated, router]);

  // Show loading while hydrating or checking auth
  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
