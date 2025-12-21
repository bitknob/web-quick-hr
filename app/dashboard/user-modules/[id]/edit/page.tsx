"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import { userModulesApi } from "@/lib/api/user-modules";
import { UserModule } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const updateUserModuleSchema = z.object({
  moduleName: z.string().optional(),
  isActive: z.boolean().optional(),
});

type UpdateUserModuleFormData = z.infer<typeof updateUserModuleSchema>;

export default function EditUserModulePage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const [userModule, setUserModule] = useState<UserModule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateUserModuleFormData>({
    resolver: zodResolver(updateUserModuleSchema),
  });

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
      const moduleData = response.response;
      setUserModule(moduleData);
      reset({
        moduleName: moduleData.moduleName,
        isActive: moduleData.isActive,
      });
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

  const onSubmit = async (data: UpdateUserModuleFormData) => {
    if (!userModule) return;

    setIsSaving(true);
    try {
      await userModulesApi.updateUserModule(userModule.id, {
        moduleName: data.moduleName,
        isActive: data.isActive,
      });
      addToast({
        title: "Success",
        description: "User module updated successfully",
        variant: "success",
      });
      router.push(`/dashboard/user-modules/${userModule.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to update user module",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
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
        <Button variant="ghost" onClick={() => router.push(`/dashboard/user-modules/${userModule.id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Module Assignment</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{userModule.moduleName}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Module Assignment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    User ID
                  </label>
                  <Input
                    id="userId"
                    value={userModule.userId}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    User ID cannot be changed
                  </p>
                </div>

                <div>
                  <label htmlFor="moduleKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Module Key
                  </label>
                  <Input
                    id="moduleKey"
                    value={userModule.moduleKey}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Module key cannot be changed
                  </p>
                </div>

                <div>
                  <label htmlFor="moduleName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Module Name
                  </label>
                  <Input
                    id="moduleName"
                    placeholder="Enter module name"
                    {...register("moduleName")}
                    className={errors.moduleName ? "border-red-500" : ""}
                  />
                  {errors.moduleName && (
                    <p className="text-sm text-red-500 mt-1">{errors.moduleName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <div className="mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("isActive")}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Button type="submit" isLoading={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/user-modules/${userModule.id}`)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

