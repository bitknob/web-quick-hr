"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning" | "info";
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 10000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[calc(100vw-2rem)] sm:max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "relative flex items-center justify-between rounded-lg border p-4 shadow-lg w-full min-w-0",
              {
                "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800": toast.variant === "default" || !toast.variant,
                "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800": toast.variant === "success",
                "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800": toast.variant === "error",
                "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800": toast.variant === "warning",
                "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800": toast.variant === "info",
              }
            )}
          >
            <div className="flex-1">
              {toast.title && (
                <div
                  className={cn("font-semibold", {
                    "text-gray-900 dark:text-gray-100": toast.variant === "default" || !toast.variant,
                    "text-green-900 dark:text-green-100": toast.variant === "success",
                    "text-red-900 dark:text-red-100": toast.variant === "error",
                    "text-yellow-900 dark:text-yellow-100": toast.variant === "warning",
                    "text-blue-900 dark:text-blue-100": toast.variant === "info",
                  })}
                >
                  {toast.title}
                </div>
              )}
              {toast.description && (
                <div
                  className={cn("text-sm mt-1", {
                    "text-gray-600 dark:text-gray-300": toast.variant === "default" || !toast.variant,
                    "text-green-700 dark:text-green-300": toast.variant === "success",
                    "text-red-700 dark:text-red-300": toast.variant === "error",
                    "text-yellow-700 dark:text-yellow-300": toast.variant === "warning",
                    "text-blue-700 dark:text-blue-300": toast.variant === "info",
                  })}
                >
                  {toast.description}
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

