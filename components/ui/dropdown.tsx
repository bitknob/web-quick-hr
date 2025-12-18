"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  contentClassName?: string;
}

export function Dropdown({
  trigger,
  children,
  align = "right",
  className,
  contentClassName,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const alignClasses = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 -translate-x-1/2",
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div onClick={handleToggle} className="cursor-pointer">
        {trigger}
      </div>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "absolute z-50 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg overflow-hidden",
                alignClasses[align],
                contentClassName
              )}
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  danger?: boolean;
}

export function DropdownItem({
  children,
  onClick,
  className,
  danger = false,
}: DropdownItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm cursor-pointer transition-colors",
        danger
          ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface DropdownDividerProps {
  className?: string;
}

export function DropdownDivider({ className }: DropdownDividerProps) {
  return (
    <div
      className={cn(
        "h-px bg-gray-200 dark:bg-gray-800 my-1",
        className
      )}
    />
  );
}

export interface DropdownHeaderProps {
  children: ReactNode;
  className?: string;
}

export function DropdownHeader({ children, className }: DropdownHeaderProps) {
  return (
    <div
      className={cn(
        "px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider",
        className
      )}
    >
      {children}
    </div>
  );
}

