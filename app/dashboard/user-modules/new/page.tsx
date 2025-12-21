"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { userModulesApi } from "@/lib/api/user-modules";
import { useToast } from "@/components/ui/toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const assignModuleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  moduleKey: z.string().min(1, "Module is required"),
  moduleName: z.string().optional(),
});

type AssignModuleFormData = z.infer<typeof assignModuleSchema>;

const defaultModuleNames: Record<string, string> = {
  employees: "Employee Management",
  payroll: "Payroll Management",
  leave: "Leave Management",
  attendance: "Attendance Management",
  approvals: "Approval Management",
  departments: "Department Management",
  companies: "Company Management",
  reports: "Reports & Analytics",
  settings: "Settings Management",
};

export default function AssignModulePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [validModuleKeys, setValidModuleKeys] = useState<string[]>([]);
  const [moduleNames, setModuleNames] = useState<Record<string, string>>({});
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control,
  } = useForm<AssignModuleFormData>({
    resolver: zodResolver(assignModuleSchema),
  });

  const selectedModuleKey = watch("moduleKey");

  useEffect(() => {
    fetchValidModuleKeys();
  }, []);

  const fetchValidModuleKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const response = await userModulesApi.getValidModuleKeys();
      setValidModuleKeys(response.response.moduleKeys);
      setModuleNames(response.response.moduleNames);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch valid module keys",
        variant: "error",
      });
      // Fallback to default modules
      setValidModuleKeys(Object.keys(defaultModuleNames));
      setModuleNames(defaultModuleNames);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  useEffect(() => {
    if (selectedModuleKey && moduleNames[selectedModuleKey]) {
      setValue("moduleName", moduleNames[selectedModuleKey]);
    }
  }, [selectedModuleKey, moduleNames, setValue]);

  const onSubmit = async (data: AssignModuleFormData) => {
    setIsSaving(true);
    try {
      const response = await userModulesApi.assignModule({
        userId: data.userId,
        moduleKey: data.moduleKey,
        moduleName: data.moduleName || moduleNames[data.moduleKey] || data.moduleKey,
      });
      addToast({
        title: "Success",
        description: "Module assigned successfully",
        variant: "success",
      });
      router.push(`/dashboard/user-modules/${response.response.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to assign module",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Assign Module to User</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Assign a module to a user at level 2, 3, or 4</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Module Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    User ID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="userId"
                    placeholder="Enter user UUID"
                    {...register("userId")}
                    className={errors.userId ? "border-red-500" : ""}
                  />
                  {errors.userId && (
                    <p className="text-sm text-red-500 mt-1">{errors.userId.message}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    User must be at hierarchy level 2, 3, or 4
                  </p>
                </div>

                <div>
                  <label htmlFor="moduleKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Module <span className="text-red-500">*</span>
                  </label>
                  {isLoadingKeys ? (
                    <div className="h-10 w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
                  ) : (
                    <Controller
                      name="moduleKey"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          error={!!errors.moduleKey}
                        >
                          <option value="">Select a module...</option>
                          {validModuleKeys.map((key) => (
                            <option key={key} value={key}>
                              {moduleNames[key] || key}
                            </option>
                          ))}
                        </Select>
                      )}
                    />
                  )}
                  {errors.moduleKey && (
                    <p className="text-sm text-red-500 mt-1">{errors.moduleKey.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="moduleName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Module Name (Optional)
                  </label>
                  <Input
                    id="moduleName"
                    placeholder="Custom module name (defaults to standard name if not provided)"
                    {...register("moduleName")}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave empty to use the default module name
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Button type="submit" isLoading={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Assign Module
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/user-modules")}
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

