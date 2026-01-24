"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";

interface ProtectedRouteChangePasswordProps {
  children: React.ReactNode;
}

export function ProtectedRouteChangePassword({ children }: ProtectedRouteChangePasswordProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const isForcedChange = searchParams.get('forced') === 'true';

  useEffect(() => {
    // Allow access if:
    // 1. It's a forced password change (user exists but not authenticated)
    // 2. User is authenticated (voluntary password change)
    // Otherwise, redirect to login
    if (!isForcedChange && !isAuthenticated) {
      router.push('/login');
    } else if (isForcedChange && !user) {
      router.push('/login');
    }
  }, [user, isAuthenticated, isForcedChange, router]);

  // Render children if access is allowed
  if ((isForcedChange && user) || (!isForcedChange && isAuthenticated)) {
    return <>{children}</>;
  }

  // Show loading state while checking
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
