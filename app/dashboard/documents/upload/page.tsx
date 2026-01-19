"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Upload, FileText, X, Check, RefreshCw } from "lucide-react";
import { documentsApi } from "@/lib/api/documents";
import { employeesApi } from "@/lib/api/employees";
import { searchApi } from "@/lib/api/search";
import { DocumentType, Employee } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useTranslations } from "@/lib/hooks/use-translations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import Link from "next/link";

const documentUploadSchema = z.object({
  employeeId: z.string().min(1, "Please select an employee"),
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    resetField,
    watch,
  } = useForm<DocumentUploadFormData>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      employeeId: "",
      documentType: "id_proof",
      expiryDate: "",
      notes: "",
    },
  });

  const selectedEmployeeId = watch("employeeId");


  useEffect(() => {
    const fetchCurrentEmployee = async () => {
      try {
        const response = await employeesApi.getCurrentEmployee();
        const currentEmp = response.response;
        setCurrentEmployeeId(currentEmp.id);
        setCurrentCompanyId(currentEmp.companyId);
        // Set current employee as default selection
        setValue("employeeId", currentEmp.id);
        // Add current employee to the list
        setEmployees([currentEmp]);
        setIsLoadingEmployees(false);
      } catch (error) {
        console.error("Failed to fetch current employee:", error);
        addToast({
          title: "Error",
          description: "Failed to fetch employee information",
          variant: "error",
        });
        setIsLoadingEmployees(false);
      }
    };
    fetchCurrentEmployee();
  }, [addToast, setValue]);

  // Debounced search for employees
  useEffect(() => {
    if (!currentCompanyId || !currentEmployeeId) return;
    
    // If search term is empty, reset to show current employee and any selected employee
    if (!employeeSearchTerm.trim()) {
      setEmployees((prevEmployees) => {
        // Build list of employees to show
        const employeesToShow: Employee[] = [];
        
        // Always include current employee
        const currentEmp = prevEmployees.find(e => e.id === currentEmployeeId);
        if (currentEmp) {
          employeesToShow.push(currentEmp);
        }
        
        // Also include the selected employee if different from current
        if (selectedEmployeeId && selectedEmployeeId !== currentEmployeeId) {
          const selectedEmp = prevEmployees.find(e => e.id === selectedEmployeeId);
          if (selectedEmp) {
            employeesToShow.push(selectedEmp);
          }
        }
        
        // Only update if the list has changed
        if (prevEmployees.length === employeesToShow.length) {
          return prevEmployees;
        }
        return employeesToShow;
      });
      return;
    }

    const searchEmployees = async () => {
      setIsLoadingEmployees(true);
      try {
        // Use global search API instead of employee-specific search
        const response = await searchApi.globalSearch({ 
          searchTerm: employeeSearchTerm,
          limit: 50 // Limit results for performance
        });
        
        // Filter only employee results and map to Employee type
        const employeeResults = response.response.results
          .filter(result => result.type === "employee")
          .map(result => ({
            id: result.id,
            employeeId: result.metadata?.employeeId as string || "",
            firstName: result.title.split(" ")[0] || "",
            lastName: result.title.split(" ").slice(1).join(" ") || "",
            userCompEmail: result.metadata?.userCompEmail as string || "",
            department: result.subtitle.split(" • ")[1] || "",
            // Required fields from Employee type
            userEmail: result.metadata?.userCompEmail as string || "",
            companyId: result.metadata?.companyId as string || currentCompanyId || "",
            jobTitle: result.subtitle.split(" • ")[0] || "",
            hireDate: "",
            status: "active" as const,
            createdAt: "",
            updatedAt: "",
          })) as Employee[];
        
        setEmployees((prevEmployees) => {
          // Always include current employee if not in results
          const currentEmp = prevEmployees.find(e => e.id === currentEmployeeId);
          const hasCurrentEmp = employeeResults.some(e => e.id === currentEmployeeId);
          
          if (currentEmp && !hasCurrentEmp) {
            return [currentEmp, ...employeeResults];
          }
          return employeeResults;
        });
      } catch (error: any) {
        console.error("Failed to search employees:", error);
        
        // Don't show error toast for every failed search - just keep current state
        // Only show error if it's not a 500 (which might be expected if endpoint doesn't exist yet)
        if (error?.response?.status !== 500) {
          addToast({
            title: "Search Failed",
            description: "Unable to search employees. Please try again.",
            variant: "error",
          });
        }
        
        // Keep the current employee in the list on error
        setEmployees((prevEmployees) => {
          const currentEmp = prevEmployees.find(e => e.id === currentEmployeeId);
          if (currentEmp) {
            return [currentEmp];
          }
          return prevEmployees;
        });
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    // Debounce the search - wait 300ms after user stops typing
    const timeoutId = setTimeout(() => {
      searchEmployees();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [employeeSearchTerm, currentCompanyId, currentEmployeeId, selectedEmployeeId, addToast]);

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
    // Find the selected employee object to get their specific companyId
    const selectedEmployee = employees.find(e => e.id === data.employeeId);
    
    // Use the employee's company ID if available, otherwise fall back to current context
    const targetCompanyId = selectedEmployee?.companyId || currentCompanyId;

    if (!targetCompanyId) {
      addToast({
        title: "Error",
        description: "Unable to determine company information",
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
        employeeId: data.employeeId,
        companyId: targetCompanyId,
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
              {/* Employee Selection */}
              <div>
                <label
                  htmlFor="employeeSearch"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Employee <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="employeeSearch"
                      type="text"
                      placeholder="Type to search employees by name, ID, email, or department..."
                      value={employeeSearchTerm}
                      onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                    {employeeSearchTerm && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {isLoadingEmployees ? (
                          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Searching...
                          </div>
                        ) : employees.length > 0 ? (
                          employees.map((employee) => (
                            <button
                              key={employee.id}
                              type="button"
                              onClick={() => {
                                setValue("employeeId", employee.id, { shouldValidate: true });
                                setEmployeeSearchTerm("");
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                            >
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {employee.firstName} {employee.lastName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                ID: {employee.employeeId}
                                {employee.department && ` • ${employee.department}`}
                                {employee.userCompEmail && ` • ${employee.userCompEmail}`}
                              </p>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            No employees found. Try a different search term.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Hidden select for form validation */}
                  <select
                    {...register("employeeId")}
                    className="hidden"
                  >
                    <option value="">Select an employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </option>
                    ))}
                  </select>
                  
                  {errors.employeeId && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.employeeId.message}</p>
                  )}
                  {selectedEmployeeId && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>Selected:</strong> {employees.find(e => e.id === selectedEmployeeId)?.firstName} {employees.find(e => e.id === selectedEmployeeId)?.lastName}
                      </p>
                    </div>
                  )}
                </div>
              </div>

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

