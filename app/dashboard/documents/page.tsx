"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Filter,
  X,
  Eye,
  Download,
} from "lucide-react";
import { documentsApi } from "@/lib/api/documents";
import { employeesApi } from "@/lib/api/employees";
import { Document, DocumentType, DocumentStatus } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useTranslations } from "@/lib/hooks/use-translations";
import { getErrorMessage } from "@/lib/utils";
import Link from "next/link";

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

const documentStatusLabels: Record<DocumentStatus, string> = {
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
  expired: "Expired",
};

export default function DocumentsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const t = useTranslations();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState<DocumentType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "all">("all");
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!currentCompanyId) {
        setIsLoading(false);
        return;
      }

      const params: {
        documentType?: DocumentType;
        status?: DocumentStatus;
      } = {};

      if (documentTypeFilter !== "all") {
        params.documentType = documentTypeFilter;
      }
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await documentsApi.getDocumentsByCompany(currentCompanyId, params);
      setDocuments(response.response);
    } catch (error: unknown) {
      addToast({
        title: t.toast.error,
        description: getErrorMessage(error),
        variant: "error",
      });
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentCompanyId, documentTypeFilter, statusFilter, addToast, t.toast.error]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    
    const fetchCurrentEmployee = async () => {
      hasFetchedRef.current = true;
      try {
        const response = await employeesApi.getCurrentEmployee();
        const companyId = response.response.companyId;
        setCurrentCompanyId(companyId);
      } catch {
        setIsLoading(false);
        addToast({
          title: "Error",
          description: "Failed to fetch company information",
          variant: "error",
        });
      }
    };
    fetchCurrentEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentCompanyId) {
      fetchDocuments();
    }
  }, [fetchDocuments, currentCompanyId]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredDocuments(documents);
    } else {
      const filtered = documents.filter(
        (doc) =>
          doc.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          documentTypeLabels[doc.documentType].toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (doc.employee &&
            `${doc.employee.firstName} ${doc.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredDocuments(filtered);
    }
  }, [searchTerm, documents]);

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      case "verified":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "rejected":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      case "expired":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const hasActiveFilters = documentTypeFilter !== "all" || statusFilter !== "all" || searchTerm.trim() !== "";

  const clearFilters = () => {
    setSearchTerm("");
    setDocumentTypeFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t.documents.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t.documents.description}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/documents/upload">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t.documents.uploadDocument}
            </Button>
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/documents/my">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t.documents.myDocuments}</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.documents.viewYourFiles}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/documents/pending">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Filter className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t.documents.pendingVerification}</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.documents.reviewDocuments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/documents/upload">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Plus className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t.documents.uploadNew}</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.documents.addDocument}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>{t.documents.allDocuments}</CardTitle>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t.documents.searchDocuments}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={documentTypeFilter}
                onChange={(e) => setDocumentTypeFilter(e.target.value as DocumentType | "all")}
                className="w-full md:w-48"
              >
                <option value="all">{t.documents.allTypes}</option>
                {Object.entries(documentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | "all")}
                className="w-full md:w-40"
              >
                <option value="all">{t.documents.allStatus}</option>
                {Object.entries(documentStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline" className="whitespace-nowrap">
                  <X className="h-4 w-4 mr-2" />
                  {t.documents.clearFilters}
                </Button>
              )}
              <Button onClick={fetchDocuments} variant="outline" isLoading={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t.common.refresh}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable />
          ) : filteredDocuments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Employee</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Document Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">File Size</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Expiry Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Uploaded</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((document, index) => (
                    <motion.tr
                      key={document.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-gray-900 dark:text-gray-100 font-medium">
                            {document.employee
                              ? `${document.employee.firstName} ${document.employee.lastName}`
                              : document.employeeId}
                          </p>
                          {document.employee?.employeeId && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{document.employee.employeeId}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">{document.documentName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{document.fileName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        {documentTypeLabels[document.documentType]}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(document.status)}`}>
                          {documentStatusLabels[document.status]}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{formatFileSize(document.fileSize)}</td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        {document.expiryDate ? formatDate(document.expiryDate) : "-"}
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{formatDate(document.createdAt)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(document.fileUrl, "_blank")}
                            title={t.documents.viewDocument}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(document.fileUrl, "_blank")}
                            title={t.documents.downloadDocument}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title={hasActiveFilters ? t.documents.noDocumentsFound : t.documents.noDocumentsUploaded}
              description={
                hasActiveFilters
                  ? t.documents.tryAdjustingFilters
                  : t.documents.getStartedByUploading
              }
              action={
                !hasActiveFilters
                  ? {
                      label: t.documents.uploadDocument,
                      onClick: () => router.push("/dashboard/documents/upload"),
                    }
                  : undefined
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

