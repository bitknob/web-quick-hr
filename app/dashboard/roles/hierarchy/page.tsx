"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, ChevronDown, ChevronRight } from "lucide-react";
import { rolesApi } from "@/lib/api/roles";
import { Role } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const getHierarchyLevelColor = (level: number): string => {
  const colors: Record<number, string> = {
    1: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
    2: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    3: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300",
    4: "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300",
    5: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    6: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
    7: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300",
    8: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300",
  };
  return colors[level] || "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
};

interface HierarchyLevel {
  level: number;
  roles: Role[];
}

export default function RoleHierarchyPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [hierarchy, setHierarchy] = useState<HierarchyLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set());

  const fetchHierarchy = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await rolesApi.getRoleHierarchyStructure();
      setHierarchy(response.response.hierarchy || []);
      // Expand all levels by default
      const allLevels = new Set(response.response.hierarchy.map((h: HierarchyLevel) => h.level));
      setExpandedLevels(allLevels);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch role hierarchy",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  const toggleLevel = (level: number) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(level)) {
      newExpanded.delete(level);
    } else {
      newExpanded.add(level);
    }
    setExpandedLevels(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading hierarchy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" onClick={() => router.push("/dashboard/roles")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Role Hierarchy
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View the complete role hierarchy structure
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Hierarchy Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hierarchy.map((levelData) => {
                const isExpanded = expandedLevels.has(levelData.level);
                const hasRoles = levelData.roles && levelData.roles.length > 0;

                return (
                  <div key={levelData.level} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                    {/* Level header */}
                    <button
                      onClick={() => toggleLevel(levelData.level)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        {hasRoles ? (
                          isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          )
                        ) : (
                          <div className="w-5 h-5" />
                        )}
                        <Badge className={getHierarchyLevelColor(levelData.level)}>
                          Level {levelData.level}
                        </Badge>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {levelData.roles?.length || 0} {levelData.roles?.length === 1 ? "role" : "roles"}
                        </span>
                      </div>
                    </button>

                    {/* Roles list */}
                    {isExpanded && hasRoles && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                      >
                        <div className="p-4 space-y-3">
                          {levelData.roles.map((role) => (
                            <Link
                              key={role.id}
                              href={`/dashboard/roles/${role.id}`}
                              className="block"
                            >
                              <motion.div
                                whileHover={{ scale: 1.005 }}
                                className="flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all"
                              >
                                <div className="flex-shrink-0">
                                  <Shield className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                    {role.name}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{role.roleKey}</code>
                                  </div>
                                  {role.description && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                      {role.description}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {role.isSystemRole && (
                                    <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs whitespace-nowrap">
                                      System
                                    </Badge>
                                  )}
                                  <Badge
                                    className={
                                      role.isActive
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs whitespace-nowrap"
                                        : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs whitespace-nowrap"
                                    }
                                  >
                                    {role.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              </motion.div>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {hierarchy.length === 0 && (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No roles found in hierarchy</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

