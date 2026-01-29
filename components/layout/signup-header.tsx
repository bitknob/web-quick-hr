"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function SignupHeader() {
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            QuickHR
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Sign In
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
