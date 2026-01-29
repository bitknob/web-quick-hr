"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { useTranslations } from "@/lib/hooks/use-translations";

interface ConfirmDialogProps {
  isOpen?: boolean;
  open?: boolean;
  title?: string;
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onOpenChange?: (open: boolean) => void;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  isOpen,
  open,
  title,
  message,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  onOpenChange,
  variant = "default",
}: ConfirmDialogProps) {
  const t = useTranslations();
  
  const dialogOpen = isOpen ?? open ?? false;
  const dialogMessage = message ?? description ?? '';
  const dialogTitle = title || t.dialog.confirmAction;
  const dialogConfirmText = confirmText || t.dialog.confirm;
  const dialogCancelText = cancelText || t.dialog.cancel;
  
  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };
  
  return (
    <AnimatePresence>
      {dialogOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50"
            onClick={handleCancel}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto w-full max-w-md"
            >
              <Card className="shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {dialogTitle}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancel}
                    className="h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">{dialogMessage}</p>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={handleCancel}>
                      {dialogCancelText}
                    </Button>
                    <Button
                      variant={variant === "destructive" ? "destructive" : "default"}
                      onClick={onConfirm}
                    >
                      {dialogConfirmText}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

