"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Company } from "@/lib/types";
import { companiesApi, CreateCompanyRequest, UpdateCompanyRequest } from "@/lib/api/companies";
import { useToast } from "@/components/ui/toast";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required").max(100, "Name must be less than 100 characters"),
  code: z.string().min(3, "Company code must be at least 3 characters").max(10, "Code must be less than 10 characters").regex(/^[A-Z0-9]+$/, "Code must contain only uppercase letters and numbers"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  hrbpId: z.string().optional(),
  subscriptionStatus: z.enum(["trial", "active", "inactive", "expired"]).optional(),
  subscriptionEndsAt: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyFormProps {
  company?: Company;
  onSuccess?: (company: Company) => void;
  onCancel?: () => void;
}

export function CompanyForm({ company, onSuccess, onCancel }: CompanyFormProps) {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name || "",
      code: company?.code || "",
      description: company?.description || "",
      hrbpId: company?.hrbpId || "",
      subscriptionStatus: company?.subscriptionStatus || "trial",
      subscriptionEndsAt: company?.subscriptionEndsAt ? 
        new Date(company.subscriptionEndsAt).toISOString().split('T')[0] : "",
      status: company?.status || "active",
    },
  });

  const subscriptionStatus = watch("subscriptionStatus");

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setDialogMessage("Please select an image file");
        setShowErrorDialog(true);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setDialogMessage("Image size must be less than 5MB");
        setShowErrorDialog(true);
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: CompanyFormData) => {
    try {
      setLoading(true);

      // Validate data
      const validationErrors = companiesApi.validateCompanyData(data);
      if (validationErrors.length > 0) {
        setDialogMessage(validationErrors.join(", "));
        setShowErrorDialog(true);
        return;
      }

      let result: Company;

      if (company) {
        // Update existing company
        const updateData: UpdateCompanyRequest = {
          ...data,
          subscriptionEndsAt: data.subscriptionEndsAt ? new Date(data.subscriptionEndsAt).toISOString() : undefined,
        };
        const response = await companiesApi.updateCompany(company.id, updateData);
        result = response.response;
      } else {
        // Create new company
        const createData: CreateCompanyRequest = {
          ...data,
          subscriptionEndsAt: data.subscriptionEndsAt ? new Date(data.subscriptionEndsAt).toISOString() : undefined,
        };
        const response = await companiesApi.createCompany(createData);
        result = response.response;
      }

      // Upload image if provided
      if (imageFile) {
        try {
          await companiesApi.uploadProfileImage(result.id, imageFile);
          setDialogMessage(`Company ${company ? 'updated' : 'created'} and image uploaded successfully`);
          setShowSuccessDialog(true);
        } catch (imageError) {
          console.error("Failed to upload image:", imageError);
          setDialogMessage(`Company ${company ? 'updated' : 'created'} but image upload failed`);
          setShowErrorDialog(true);
        }
      } else {
        setDialogMessage(`Company ${company ? 'updated' : 'created'} successfully`);
        setShowSuccessDialog(true);
      }

      onSuccess?.(result);
    } catch (error) {
      console.error("Failed to save company:", error);
      setDialogMessage(`Failed to ${company ? 'update' : 'create'} company`);
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {company ? "Edit Company" : "Create New Company"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Profile Image
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-100 dark:bg-gray-800 overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : company?.profileImageUrl ? (
                  <img src={company.profileImageUrl} alt={company.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs">No image</span>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose Image
                </Button>
                {(imagePreview || company?.profileImageUrl) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={removeImage}
                    className="ml-2"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              JPG, PNG, GIF up to 5MB
            </p>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name *
              </label>
              <Input
                {...register("name")}
                placeholder="Enter company name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Code *
              </label>
              <Input
                {...register("code")}
                placeholder="e.g., ACME001"
                className={errors.code ? "border-red-500" : ""}
              />
              {errors.code && (
                <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Enter company description"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Status and Subscription */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <Select {...register("status")} className={errors.status ? "border-red-500" : ""}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
              {errors.status && (
                <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subscription Status
              </label>
              <Select {...register("subscriptionStatus")} className={errors.subscriptionStatus ? "border-red-500" : ""}>
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </Select>
              {errors.subscriptionStatus && (
                <p className="text-red-500 text-xs mt-1">{errors.subscriptionStatus.message}</p>
              )}
            </div>
          </div>

          {/* Subscription End Date */}
          {(subscriptionStatus === "trial" || subscriptionStatus === "active") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subscription End Date
              </label>
              <Input
                type="date"
                {...register("subscriptionEndsAt")}
                className={errors.subscriptionEndsAt ? "border-red-500" : ""}
              />
              {errors.subscriptionEndsAt && (
          )}
        </div>

        {/* Status and Subscription */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <Select {...register("status")} className={errors.status ? "border-red-500" : ""}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
            {errors.status && (
              <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subscription Status
            </label>
            <Select {...register("subscriptionStatus")} className={errors.subscriptionStatus ? "border-red-500" : ""}>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </Select>
            {errors.subscriptionStatus && (
              <p className="text-red-500 text-xs mt-1">{errors.subscriptionStatus.message}</p>
            )}
          </div>
        </div>

        {/* Subscription End Date */}
        {(subscriptionStatus === "trial" || subscriptionStatus === "active") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subscription End Date
            </label>
            <Input
              type="date"
              {...register("subscriptionEndsAt")}
              className={errors.subscriptionEndsAt ? "border-red-500" : ""}
            />
            {errors.subscriptionEndsAt && (
              <p className="text-red-500 text-xs mt-1">{errors.subscriptionEndsAt.message}</p>
            )}
          </div>
        )}

        {/* HRBP ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            HRBP ID
          </label>
          <Input
            {...register("hrbpId")}
            placeholder="Enter HRBP user ID"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {company ? "Updating..." : "Creating..."}
              </>
            ) : (
              company ? "Update Company" : "Create Company"
            )}
          </Button>
        </div>
      </form>
    </div>
  </Card>

  {/* Success Dialog */}
  <ConfirmDialog
    open={showSuccessDialog}
    title="Success!"
    message={dialogMessage}
    confirmText="OK"
    onConfirm={() => setShowSuccessDialog(false)}
    onOpenChange={(open) => !open && setShowSuccessDialog(false)}
  />

  {/* Error Dialog */}
  <ConfirmDialog
    open={showErrorDialog}
    title="Error"
    message={dialogMessage}
    confirmText="OK"
    onConfirm={() => setShowErrorDialog(false)}
    onOpenChange={(open) => !open && setShowErrorDialog(false)}
  />
</>
