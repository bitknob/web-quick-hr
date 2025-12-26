"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Upload, FileText, X, Check } from "lucide-react";
import { documentsApi } from "@/lib/api/documents";
import { employeesApi } from "@/lib/api/employees";
import { DocumentType } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useTranslations } from "@/lib/hooks/use-translations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import Link from "next/link";

const documentUploadSchema = z.object({
  documentType: z.enum([
    "id_proof",
    "address_proof",
    "pan_card",
    "aadhaar_card",
    "passport",
    "driving_license",
    "educational_certificate",
    "experience_certificate",
    "offer_letter",
    "appointment_letter",
    "relieving_letter",
    "salary_slip",
    "bank_statement",
    "form_16",
    "other",
  ]),
  documentName: z.string().min(1, "Document name is required").max(200, "Document name must be less than 200 characters"),
  expiryDate: z.string().optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
  document: z.instanceof(File, { message: "Please select a document to upload" }),
});

type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;

const documentTypeLabels: Record<DocumentType, string> = {
  id_proof: "ID Proof",
  address_proof: "Address Proof",
  pan_card: "PAN Card",
  aadhaar_card: "Aadhaar Card",
  passport: "Passport",
  driving_license: "Driving License",
  educational_certificate: "Educational Certificate",
  experience_certificate: "Experience Certificate",
  offer_letter: "Offer Letter",
  appointment_letter: "Appointment Letter",
  relieving_letter: "Relieving Letter",
  salary_slip: "Salary Slip",
  bank_statement: "Bank Statement",
  form_16: "Form 16",
  other: "Other",
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function UploadDocumentPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const t = useTranslations();
  const [isUploading, setIsUploading] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    resetField,
  } = useForm<DocumentUploadFormData>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      documentType: "id_proof",
      expiryDate: "",
      notes: "",
    },
  });


  useEffect(() => {
    const fetchCurrentEmployee = async () => {
      try {
        const response = await employeesApi.getCurrentEmployee();
        setCurrentEmployeeId(response.response.id);
        setCurrentCompanyId(response.response.companyId);
      } catch {
        addToast({
          title: "Error",
          description: "Failed to fetch employee information",
          variant: "error",
        });
      }
    };
    fetchCurrentEmployee();
  }, [addToast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError("");

    if (!file) {
      setSelectedFile(null);
      resetField("document");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      setSelectedFile(null);
      resetField("document");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setFileError("Please upload a PDF, image (JPG/PNG), or Word document");
      setSelectedFile(null);
      resetField("document");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);
    setValue("document", file, { shouldValidate: true });
  };

  const removeFile = () => {
    setSelectedFile(null);
    resetField("document");
    setFileError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const onSubmit = async (data: DocumentUploadFormData) => {
    if (!currentEmployeeId || !currentCompanyId) {
      addToast({
        title: "Error",
        description: "Unable to determine employee or company information",
        variant: "error",
      });
      return;
    }

    if (!selectedFile) {
      setFileError("Please select a document to upload");
      return;
    }

    setIsUploading(true);
    try {
      await documentsApi.uploadDocument({
        document: selectedFile,
        employeeId: currentEmployeeId,
        companyId: currentCompanyId,
        documentType: data.documentType,
        documentName: data.documentName,
        expiryDate: data.expiryDate || undefined,
        notes: data.notes || undefined,
      });

      addToast({
        title: t.toast.success,
        description: t.documents.documentUploaded,
        variant: "success",
      });

      router.push("/dashboard/documents/my");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header
              ?.responseMessage
          : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to upload document",
        variant: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Link href="/dashboard/documents/my">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Upload Document</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Upload and manage your documents</p>
          </div>
        </div>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="document" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Document File <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="document"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="document"
                      className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-800/50"
                    >
                      <Upload className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {selectedFile ? "Change File" : "Choose File"}
                      </span>
                    </label>
                    {selectedFile && (
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <FileText className="h-4 w-4" />
                        <span>{selectedFile.name}</span>
                        <span className="text-gray-500 dark:text-gray-400">({formatFileSize(selectedFile.size)})</span>
                        <button
                          type="button"
                          onClick={removeFile}
                          className="ml-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {fileError && <p className="text-sm text-red-600 dark:text-red-400">{fileError}</p>}
                  {errors.document && <p className="text-sm text-red-600 dark:text-red-400">{errors.document.message}</p>}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Supported formats: PDF, JPG, PNG, DOC, DOCX (Max size: 2MB)
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="documentType"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Document Type <span className="text-red-500">*</span>
                </label>
                <Select
                  id="documentType"
                  {...register("documentType")}
                  className={cn(errors.documentType && "border-red-500")}
                >
                  {Object.entries(documentTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                {errors.documentType && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.documentType.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="documentName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Document Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="documentName"
                  {...register("documentName")}
                  placeholder={t.documents.enterDocumentName}
                  className={cn(errors.documentName && "border-red-500")}
                />
                {errors.documentName && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.documentName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expiry Date <span className="text-gray-400 dark:text-gray-500 text-xs">(Optional)</span>
                </label>
                <Input
                  id="expiryDate"
                  type="date"
                  {...register("expiryDate")}
                  className={cn(errors.expiryDate && "border-red-500")}
                />
                {errors.expiryDate && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.expiryDate.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes <span className="text-gray-400 dark:text-gray-500 text-xs">(Optional)</span>
                </label>
                <textarea
                  id="notes"
                  {...register("notes")}
                  rows={4}
                  placeholder={t.documents.enterAdditionalNotes}
                  className={cn(
                    "flex w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ring-offset-white dark:ring-offset-gray-900 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-sm hover:border-gray-400 dark:hover:border-gray-500 resize-none",
                    errors.notes && "border-red-500"
                  )}
                />
                {errors.notes && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.notes.message}</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum 500 characters</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Link href="/dashboard/documents/my">
                <Button type="button" variant="outline" disabled={isUploading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" isLoading={isUploading} disabled={!selectedFile}>
                <Check className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

