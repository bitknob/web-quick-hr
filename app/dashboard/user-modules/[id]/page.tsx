"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, CheckCircle2, XCircle } from "lucide-react";
import { userModulesApi } from "@/lib/api/user-modules";
import { UserModule } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const moduleColors: Record<string, string> = {
  employees: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
  payroll: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
  leave: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
  attendance: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
  approvals: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
  departments: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300",
  companies: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300",
  reports: "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300",
  settings: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300",
};

export default function UserModuleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const [userModule, setUserModule] = useState<UserModule | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchUserModule(params.id as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchUserModule = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await userModulesApi.getUserModule(id);
      setUserModule(response.response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch user module",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading user module...</p>
        </div>
      </div>
    );
  }

  if (!userModule) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">User module not found</p>
        <Button onClick={() => router.push("/dashboard/user-modules")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to User Modules
        </Button>
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
        <Button variant="ghost" onClick={() => router.push("/dashboard/user-modules")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {userModule.moduleName}
            </h1>
            <Badge className={moduleColors[userModule.moduleKey] || moduleColors.settings}>
              {userModule.moduleKey}
            </Badge>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Module Assignment Details</p>
        </div>
        <Link href={`/dashboard/user-modules/${userModule.id}/edit`}>
          <Button>Edit Assignment</Button>
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Assignment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</label>
                <div className="mt-1">
                  <code className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded block text-gray-900 dark:text-gray-100">
                    {userModule.userId}
                  </code>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Module Key</label>
                <div className="mt-1">
                  <Badge className={moduleColors[userModule.moduleKey] || moduleColors.settings}>
                    {userModule.moduleKey}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Module Name</label>
                <p className="mt-1 text-gray-900 dark:text-gray-100">{userModule.moduleName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                <div className="mt-1">
                  <Badge
                    className={
                      userModule.isActive
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                    }
                  >
                    {userModule.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</label>
                <p className="mt-1 text-gray-900 dark:text-gray-100">
                  {new Date(userModule.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated At</label>
                <p className="mt-1 text-gray-900 dark:text-gray-100">
                  {new Date(userModule.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

