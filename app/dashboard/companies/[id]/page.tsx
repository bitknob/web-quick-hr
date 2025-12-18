"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Save, Upload, Image as ImageIcon } from "lucide-react";
import { companiesApi } from "@/lib/api/companies";
import { Company } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  description: z.string().optional(),
  hrbpId: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  useEffect(() => {
    if (params.id) {
      fetchCompany(params.id as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchCompany = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await companiesApi.getCompany(id);
      setCompany(response.response);
      reset({
        name: response.response.name,
        description: response.response.description || "",
        hrbpId: response.response.hrbpId || "",
        status: response.response.status,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch company",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CompanyFormData) => {
    if (!company) return;

    setIsSaving(true);
    try {
      await companiesApi.updateCompany(company.id, {
        name: data.name,
        description: data.description || undefined,
        hrbpId: data.hrbpId || undefined,
        status: data.status,
      });
      addToast({
        title: "Success",
        description: "Company updated successfully",
        variant: "success",
      });
      fetchCompany(company.id);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to update company",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!company || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    if (!file.type.startsWith("image/")) {
      addToast({
        title: "Error",
        description: "Please select an image file",
        variant: "error",
      });
      return;
    }

    setIsUploading(true);
    try {
      await companiesApi.uploadProfileImage(company.id, file);
      addToast({
        title: "Success",
        description: "Profile image uploaded successfully",
        variant: "success",
      });
      fetchCompany(company.id);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading company...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Company not found</p>
        <Button onClick={() => router.push("/dashboard/companies")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Companies
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
        <Button variant="ghost" onClick={() => router.push("/dashboard/companies")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {company.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Company Code: {company.code}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Company Profile Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {company.profileImageUrl ? (
                <div className="relative w-32 h-32">
                  <Image
                    src={company.profileImageUrl}
                    alt={company.name}
                    fill
                    className="rounded-lg object-cover border border-gray-200 dark:border-gray-800"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-800">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="profile-image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {company.profileImageUrl ? "Change Image" : "Upload Image"}
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Upload a profile image for the company
                </p>
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
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Name
                  </label>
                  <Input
                    id="name"
                    {...register("name")}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Code
                  </label>
                  <Input
                    id="code"
                    value={company.code}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Company code cannot be changed after creation
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <Input
                    id="description"
                    {...register("description")}
                  />
                </div>

                <div>
                  <label htmlFor="hrbpId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    HRBP ID
                  </label>
                  <Input
                    id="hrbpId"
                    placeholder="Enter HRBP UUID"
                    {...register("hrbpId")}
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <Select
                    id="status"
                    {...register("status")}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" isLoading={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

