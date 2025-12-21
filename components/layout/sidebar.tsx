"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  User,
  Settings,
  Menu,
  X,
  Building2,
  FolderTree,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  Grid3x3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/auth-store";
import { authApi } from "@/lib/api/auth";
import { MenuItem } from "@/lib/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  home: LayoutDashboard,
  dashboard: LayoutDashboard,
  building: Building2,
  companies: Building2,
  users: Users,
  employees: Users,
  sitemap: FolderTree,
  departments: FolderTree,
  "check-circle": FileCheck,
  approvals: FileCheck,
  calendar: Calendar,
  leave: Calendar,
  clock: Clock,
  attendance: Clock,
  user: User,
  profile: User,
  settings: Settings,
};

function getIcon(iconName?: string) {
  if (!iconName) return LayoutDashboard;
  return iconMap[iconName.toLowerCase()] || LayoutDashboard;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  const isEmptyObject = (obj: unknown): boolean => {
    if (!obj || typeof obj !== "object" || obj === null) return false;
    return Object.keys(obj).length === 0;
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await authApi.getMenu();
        const items = response.response || [];
        
        // Check if all items are empty objects
        const allEmpty = items.length > 0 && items.every(isEmptyObject);
        
        if (allEmpty) {
          // Set empty array to show placeholder icons
          setMenuItems([]);
        } else {
          // Filter out empty objects and set valid menu items
          const validItems = items.filter((item) => !isEmptyObject(item));
          setMenuItems(validItems);
          
          // Auto-expand items that have active children
          const activeExpanded = new Set<string>();
          validItems.forEach((item) => {
            if (item.children) {
              const hasActiveChild = item.children.some(
                (child) => pathname === child.path || pathname.startsWith(child.path + "/")
              );
              if (hasActiveChild || pathname === item.path || pathname.startsWith(item.path + "/")) {
                activeExpanded.add(item.id);
              }
            }
          });
          setExpandedItems(activeExpanded);
        }
      } catch (error) {
        // Check if it's a network error
        const isNetworkError = error instanceof Error && 
          (error.message === "Network Error" || 
           error.message.includes("ERR_NETWORK") ||
           error.message.includes("Failed to fetch"));
        
        if (isNetworkError) {
          console.warn("Menu API unavailable - API server may not be running. Using empty menu.");
        } else {
          console.error("Failed to fetch menu:", error);
        }
        // Fallback to empty menu or default menu
        setMenuItems([]);
      } finally {
        setIsLoadingMenu(false);
      }
    };

    if (user) {
      fetchMenu();
    }
  }, [user, pathname]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const isItemActive = (item: MenuItem, isChild: boolean = false): boolean => {
    if (item.path === "/dashboard") {
      return pathname === "/dashboard";
    }
    
    // Exact match always works
    if (pathname === item.path) {
      return true;
    }
    
    // For child items, only exact match (no prefix matching)
    if (isChild) {
      return false;
    }
    
    // Prefix match (only for parent items without children, or parent itself)
    if (pathname.startsWith(item.path + "/")) {
      return true;
    }
    
    return false;
  };

  const hasActiveChild = (item: MenuItem): boolean => {
    if (!item.children) return false;
    // Check if any child matches the current pathname
    // Prioritize exact matches, but also allow prefix matches for nested routes
    // However, if a child path is the same as the parent path, only match exactly
    return item.children.some((child) => {
      // Exact match always works
      if (pathname === child.path) {
        return true;
      }
      // Prefix match only if child path is longer than parent path (more specific)
      // This prevents matching a child that has the same path as parent when pathname is a child route
      if (child.path.length > item.path.length && pathname.startsWith(child.path + "/")) {
        return true;
      }
      return false;
    });
  };

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-800 cursor-pointer"
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <aside
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-40 w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-lg lg:shadow-none",
          "transform transition-transform duration-300",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Quick HR
            </h1>
            {user?.role && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">
                {user.role.replace(/_/g, " ")}
              </p>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {isLoadingMenu ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : menuItems.length > 0 ? (
              menuItems.map((item, index) => {
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedItems.has(item.id);
                const Icon = getIcon(item.icon);
                // For parent items with children, only highlight if a child is active
                // For items without children, highlight if the item itself is active
                const shouldHighlight = hasChildren ? hasActiveChild(item) : isItemActive(item);

                return (
                  <motion.div
                    key={item.id || `menu-item-${index}-${item.path || item.label || 'unknown'}`}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div>
                      {hasChildren ? (
                        <button
                          onClick={() => toggleExpanded(item.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                            shouldHighlight
                              ? "bg-blue-600 dark:bg-blue-700 text-white shadow-md"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-medium flex-1 text-left">{item.label}</span>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      ) : item.path ? (
                        <Link
                          href={item.path}
                          onClick={() => setIsMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                            shouldHighlight
                              ? "bg-blue-600 dark:bg-blue-700 text-white shadow-md"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      ) : (
                        <div
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                            "text-gray-700 dark:text-gray-300 opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                      )}

                      <AnimatePresence>
                        {hasChildren && isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-800 pl-2">
                              {item.children?.map((child) => {
                                // Check if this child is active
                                // Exact match always works
                                let isChildActive = pathname === child.path;
                                // Prefix match only if child path is longer than parent (more specific)
                                // This prevents matching when child has same path as parent
                                if (!isChildActive && child.path && item.path && child.path.length > item.path.length) {
                                  isChildActive = pathname.startsWith(child.path + "/");
                                }
                                return child.path ? (
                                  <Link
                                    key={child.id}
                                    href={child.path}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={cn(
                                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                                      isChildActive
                                        ? "bg-blue-600 dark:bg-blue-700 text-white shadow-md"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    )}
                                  >
                                    <span className="font-medium">{child.label}</span>
                                  </Link>
                                ) : (
                                  <div
                                    key={child.id}
                                    className={cn(
                                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                                      "text-gray-600 dark:text-gray-400 opacity-50 cursor-not-allowed"
                                    )}
                                  >
                                    <span className="font-medium">{child.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-center h-12"
                  >
                    <Grid3x3 className="h-5 w-5 text-gray-400 dark:text-gray-600" />
                  </motion.div>
                ))}
              </div>
            )}
          </nav>
        </div>
      </aside>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

