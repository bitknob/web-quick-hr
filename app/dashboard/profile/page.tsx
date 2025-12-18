"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Save } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { authApi } from "@/lib/api/auth";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const profileSchema = z.object({
  email: z.string().email(),
  phoneNumber: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser, checkAuth } = useAuthStore();
  const { addToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user, reset]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "error",
      });
      return;
    }

    setIsUploading(true);
    try {
      const response = await authApi.uploadProfileImage(file);
      setUser(response.response);
      addToast({
        title: "Success",
        description: "Profile image uploaded successfully",
        variant: "success",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to upload image",
        variant: "error",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onSubmit = async () => {
    try {
      await checkAuth();
      addToast({
        title: "Success",
        description: "Profile information is read-only. Contact admin to update.",
        variant: "success",
      });
    } catch {
      addToast({
        title: "Error",
        description: "Failed to update profile",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your profile information</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  {user?.profileImageUrl ? (
                    <motion.img
                      src={user.profileImageUrl}
                      alt={user.email}
                      className="h-32 w-32 rounded-full border-4 border-gray-200 dark:border-gray-700"
                      whileHover={{ scale: 1.05 }}
                    />
                  ) : (
                    <motion.div
                      className="h-32 w-32 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold"
                      whileHover={{ scale: 1.05 }}
                    >
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </motion.div>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                  </motion.button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {user?.email?.split("@")[0]}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mt-1">
                  {user?.role?.replace(/_/g, " ") || "User"}
                </p>
                {isUploading && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">Uploading...</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    disabled
                    className="bg-gray-50 dark:bg-gray-900"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Phone Number
                  </label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    {...register("phoneNumber")}
                    disabled
                    className="bg-gray-50"
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-500 mt-1">{errors.phoneNumber.message}</p>
                  )}
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Profile information is managed by your administrator
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

