"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { documentsApi } from "@/lib/api/documents";
import { employeesApi } from "@/lib/api/employees";
import { Document, DocumentType, DocumentStatus } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useTranslations } from "@/lib/hooks/use-translations";
import { getErrorMessage } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api-client";
import Link from "next/link";

const getDocumentTypeLabels = (t: ReturnType<typeof useTranslations>): Record<DocumentType, string> => ({
  id_proof: t.documentTypes.idProof,
  address_proof: t.documentTypes.addressProof,
  pan_card: t.documentTypes.panCard,
  aadhaar_card: t.documentTypes.aadhaarCard,
  passport: t.documentTypes.passport,
  driving_license: t.documentTypes.drivingLicense,
  educational_certificate: t.documentTypes.educationalCertificate,
  experience_certificate: t.documentTypes.experienceCertificate,
  offer_letter: t.documentTypes.offerLetter,
  appointment_letter: t.documentTypes.appointmentLetter,
  relieving_letter: t.documentTypes.relievingLetter,
  salary_slip: t.documentTypes.salarySlip,
  bank_statement: t.documentTypes.bankStatement,
  form_16: t.documentTypes.form16,
  other: t.documentTypes.other,
});

const getDocumentStatusLabels = (t: ReturnType<typeof useTranslations>): Record<DocumentStatus, string> => ({
  pending: t.documentStatus.pending,
  verified: t.documentStatus.verified,
  rejected: t.documentStatus.rejected,
  expired: t.documentStatus.expired,
});

export default function EmployeeDocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const documentTypeLabels = getDocumentTypeLabels(t);
  const documentStatusLabels = getDocumentStatusLabels(t);

  // Get employee ID from URL if present
  const employeeIdFromUrl = searchParams.get("employeeId");

  const fetchDocuments = useCallback(async () => {
    if (!currentCompanyId) {
      setIsLoading(false);
      setDocuments([]);
      return;
    }

    setIsLoading(true);
    try {
      const params: {
        documentType?: DocumentType;
        status?: DocumentStatus;
        employeeId?: string;
      } = {};

      if (documentTypeFilter !== "all") {
        params.documentType = documentTypeFilter;
      }
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (employeeIdFromUrl) {
        params.employeeId = employeeIdFromUrl;
      }

      const response = await documentsApi.getDocumentsByCompany(currentCompanyId, params);
      setDocuments(response.response || []);
    } catch (error: unknown) {
      console.error("Failed to fetch documents:", error);
      addToast({
        title: t.toast.error,
        description: getErrorMessage(error) || t.documents.failedToFetchDocuments,
        variant: "error",
      });
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentCompanyId, documentTypeFilter, statusFilter, employeeIdFromUrl, addToast, t.toast.error, t.documents.failedToFetchDocuments]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    
    const fetchCurrentEmployee = async () => {
      hasFetchedRef.current = true;
      setIsLoading(true);
      try {
        const response = await employeesApi.getCurrentEmployee();
        const companyId = response.response.companyId;
        if (companyId) {
          setCurrentCompanyId(companyId);
        } else {
          setIsLoading(false);
          addToast({
            title: t.toast.error,
            description: t.errors.failedToFetchCompanyInfo,
            variant: "error",
          });
        }
      } catch {
        setIsLoading(false);
        addToast({
          title: t.toast.error,
          description: t.errors.failedToFetchCompanyInfo,
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
          doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDocuments(filtered);
    }
  }, [searchTerm, documents, documentTypeLabels]);

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

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "verified":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "expired":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
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

  // Calculate document statistics
  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === "pending").length,
    verified: documents.filter(d => d.status === "verified").length,
    rejected: documents.filter(d => d.status === "rejected").length,
    expired: documents.filter(d => d.status === "expired").length,
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Document Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View, manage, and track all employee documents
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/documents/upload">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Document Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Verified</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.verified}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expired</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.expired}</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/documents/upload">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upload New</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Add a new document</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/documents/pending">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-yellow-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Filter className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Review Pending</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Documents awaiting verification</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/documents/my">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">My Documents</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">View your uploaded files</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>All Documents</CardTitle>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
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
                <option value="all">All Types</option>
                {(Object.keys(documentTypeLabels) as DocumentType[]).map((value) => (
                  <option key={value} value={value}>
                    {documentTypeLabels[value]}
                  </option>
                ))}
              </Select>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | "all")}
                className="w-full md:w-40"
              >
                <option value="all">All Status</option>
                {(Object.keys(documentStatusLabels) as DocumentStatus[]).map((value) => (
                  <option key={value} value={value}>
                    {documentStatusLabels[value]}
                  </option>
                ))}
              </Select>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline" className="whitespace-nowrap">
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
              <Button onClick={fetchDocuments} variant="outline" isLoading={isLoading}>
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
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Document</th>
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
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">{document.documentName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{document.fileName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {documentTypeLabels[document.documentType]}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full ${getStatusColor(document.status)}`}>
                          {getStatusIcon(document.status)}
                          {documentStatusLabels[document.status]}
                        </div>
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
                            onClick={() => window.open(getFullFileUrl(document.fileUrl), "_blank")}
                            title="View Document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <a
                            href={getFullFileUrl(document.fileUrl)}
                            download={document.fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 h-8 w-8"
                            title="Download Document"
                          >
                            <Download className="h-4 w-4" />
                          </a>
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
              title={hasActiveFilters ? "No documents found" : "No documents uploaded"}
              description={
                hasActiveFilters
                  ? "Try adjusting your filters to see more results"
                  : "Get started by uploading your first document"
              }
              action={
                !hasActiveFilters
                  ? {
                      label: "Upload Document",
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
