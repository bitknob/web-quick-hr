"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import { companiesApi } from "@/lib/api/companies";
import { useToast } from "@/components/ui/toast";
import { useTranslations } from "@/lib/hooks/use-translations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const newCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  code: z.string().min(1, "Company code is required"),
  description: z.string().optional(),
  hrbpId: z.string().optional(),
});

type NewCompanyFormData = z.infer<typeof newCompanySchema>;

export default function NewCompanyPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const t = useTranslations();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewCompanyFormData>({
    resolver: zodResolver(newCompanySchema),
  });

  const onSubmit = async (data: NewCompanyFormData) => {
    setIsSaving(true);
    try {
      const response = await companiesApi.createCompany({
        name: data.name,
        code: data.code,
        description: data.description || undefined,
        hrbpId: data.hrbpId || undefined,
      });
      addToast({
        title: t.toast.success,
        description: t.companies.companyCreatedSuccessfully,
        variant: "success",
      });
      router.push(`/dashboard/companies/${response.response.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: t.toast.error,
        description: errorMessage || t.companies.failedToCreateCompany,
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
        <Button variant="ghost" onClick={() => router.push("/dashboard/companies")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Company</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Add a new company to the system</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    placeholder={t.companies.enterCompanyName}
                    {...register("name")}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="code"
                    placeholder={t.companies.enterCompanyCode}
                    {...register("code")}
                    className={errors.code ? "border-red-500" : ""}
                  />
                  {errors.code && (
                    <p className="text-sm text-red-500 mt-1">{errors.code.message}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Unique code for the company (must be unique across all companies)
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <Input
                    id="description"
                    placeholder={t.companies.enterCompanyDescription}
                    {...register("description")}
                  />
                </div>

                <div>
                  <label htmlFor="hrbpId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    HRBP ID
                  </label>
                  <Input
                    id="hrbpId"
                    placeholder={t.companies.enterHrbpUuidOptional}
                    {...register("hrbpId")}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    UUID of the HR Business Partner assigned to this company
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Button type="submit" isLoading={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Create Company
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/companies")}
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

