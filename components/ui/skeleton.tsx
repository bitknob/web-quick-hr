"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  animation?: "pulse" | "wave" | "none";
}

export function Skeleton({
  className,
  variant = "rectangular",
  animation = "pulse",
  ...props
}: SkeletonProps) {
  const baseClasses = "bg-gray-200";
  
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "",
    none: "",
  };

  if (animation === "wave") {
    return (
      <motion.div
        className={cn(baseClasses, variantClasses[variant], className)}
        animate={{
          background: [
            "linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)",
            "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
          ],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-32 h-6" />
        <Skeleton variant="circular" className="w-12 h-12" />
      </div>
      <Skeleton variant="text" className="w-24 h-4" />
      <Skeleton variant="text" className="w-full h-4" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="text-left py-3 px-4">
              <Skeleton variant="text" className="w-24 h-4" />
            </th>
            <th className="text-left py-3 px-4">
              <Skeleton variant="text" className="w-24 h-4" />
            </th>
            <th className="text-left py-3 px-4">
              <Skeleton variant="text" className="w-24 h-4" />
            </th>
            <th className="text-left py-3 px-4">
              <Skeleton variant="text" className="w-24 h-4" />
            </th>
            <th className="text-left py-3 px-4">
              <Skeleton variant="text" className="w-24 h-4" />
            </th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-4 px-4">
                <Skeleton variant="text" className="w-32 h-4" />
              </td>
              <td className="py-4 px-4">
                <Skeleton variant="text" className="w-40 h-4" />
              </td>
              <td className="py-4 px-4">
                <Skeleton variant="text" className="w-48 h-4" />
              </td>
              <td className="py-4 px-4">
                <Skeleton variant="text" className="w-20 h-6 rounded-full" />
              </td>
              <td className="py-4 px-4">
                <Skeleton variant="text" className="w-24 h-4" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

