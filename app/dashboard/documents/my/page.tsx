"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dropdown, DropdownItem, DropdownDivider } from "@/components/ui/dropdown";
import {
  FileText,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  X,
} from "lucide-react";
import { documentsApi } from "@/lib/api/documents";
import { employeesApi } from "@/lib/api/employees";
import { Document, DocumentType, DocumentStatus } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslations } from "@/lib/hooks/use-translations";
import { getErrorMessage } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api-client";
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

export default function MyDocumentsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const t = useTranslations();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState<DocumentType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "all">("all");
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchMyDocuments = useCallback(
    async (employeeId: string, companyId: string) => {
      setIsLoading(true);
      try {
        const params: {
          companyId?: string;
          documentType?: DocumentType;
          status?: DocumentStatus;
        } = {
          companyId,
        };

        if (documentTypeFilter !== "all") {
          params.documentType = documentTypeFilter;
        }
        if (statusFilter !== "all") {
          params.status = statusFilter;
        }

        const response = await documentsApi.getDocumentsByEmployee(employeeId, params);
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
    },
    [documentTypeFilter, statusFilter, addToast, t.toast.error]
  );

  useEffect(() => {
    if (hasFetchedRef.current) return;
    
    const fetchCurrentEmployee = async () => {
      hasFetchedRef.current = true;
      try {
        const response = await employeesApi.getCurrentEmployee();
        const employeeId = response.response.id;
        const companyId = response.response.companyId;
        setCurrentEmployeeId(employeeId);
        setCurrentCompanyId(companyId);
        fetchMyDocuments(employeeId, companyId);
      } catch {
        addToast({
          title: t.toast.error,
          description: t.documents.failedToFetchCompanyInfo,
          variant: "error",
        });
      }
    };
    fetchCurrentEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredDocuments(documents);
    } else {
      const filtered = documents.filter(
        (doc) =>
          doc.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          documentTypeLabels[doc.documentType].toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDocuments(filtered);
    }
  }, [searchTerm, documents]);

  const handleDeleteClick = (documentId: string) => {
    if (!currentCompanyId) return;
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete || !currentCompanyId) return;

    setDeletingId(documentToDelete);
    try {
      await documentsApi.deleteDocument(documentToDelete, currentCompanyId);
      addToast({
        title: t.toast.success,
        description: t.documents.documentDeleted,
        variant: "success",
      });
      if (currentEmployeeId && currentCompanyId) {
        fetchMyDocuments(currentEmployeeId, currentCompanyId);
      }
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch (error: unknown) {
      addToast({
        title: t.toast.error,
        description: getErrorMessage(error),
        variant: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (document: Document) => {
    const link = window.document.createElement("a");
    link.href = getFullFileUrl(document.fileUrl);
    link.download = document.fileName;
    link.target = "_blank";
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

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

  const getFullFileUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t.documents.myDocuments}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t.documents.myDocumentsDescription}</p>
        </div>
        <Link href="/dashboard/documents/upload">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t.documents.uploadDocument}
          </Button>
        </Link>
      </motion.div>

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
                  Clear Filters
                </Button>
              )}
              <Button
                onClick={() => {
                  if (currentEmployeeId && currentCompanyId) {
                    fetchMyDocuments(currentEmployeeId, currentCompanyId);
                  }
                }}
                variant="outline"
                isLoading={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
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
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.documents.documentName}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.documents.type}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.documents.status}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.documents.fileSize}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.documents.expiryDate}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.documents.uploaded}</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.common.actions}</th>
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
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">{document.documentName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{document.fileName}</p>
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
                        <div className="flex justify-end">
                          <Dropdown
                            trigger={
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            }
                          >
                            <DropdownItem onClick={() => handleDownload(document)}>
                              <Download className="h-4 w-4 mr-2" />
                              {t.common.download}
                            </DropdownItem>
                            <DropdownItem
                              onClick={() => {
                                window.open(getFullFileUrl(document.fileUrl), "_blank");
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {t.common.view}
                            </DropdownItem>
                            <DropdownDivider />
                            <DropdownItem onClick={() => router.push(`/dashboard/documents/${document.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {t.common.edit}
                            </DropdownItem>
                            <DropdownDivider />
                            <DropdownItem
                              onClick={() => handleDeleteClick(document.id)}
                              danger
                              className={deletingId === document.id ? "opacity-50 cursor-not-allowed" : ""}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownItem>
                          </Dropdown>
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
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title={t.dialog.deleteDocument.title}
        message={t.dialog.deleteDocument.message}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDocumentToDelete(null);
        }}
      />
    </div>
  );
}

