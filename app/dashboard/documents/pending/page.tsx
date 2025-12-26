"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, FileText, Eye, Download, RefreshCw } from "lucide-react";
import { documentsApi } from "@/lib/api/documents";
import { employeesApi } from "@/lib/api/employees";
import { Document, DocumentType } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useTranslations } from "@/lib/hooks/use-translations";
import { getErrorMessage } from "@/lib/utils";

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

export default function PendingDocumentsPage() {
  const { addToast } = useToast();
  const t = useTranslations();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchPendingDocuments = useCallback(
    async (companyId: string) => {
      setIsLoading(true);
      try {
        const response = await documentsApi.getPendingDocuments(companyId);
        setDocuments(response.response);
      } catch (error: unknown) {
        addToast({
          title: "Error",
          description: getErrorMessage(error),
          variant: "error",
        });
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    if (hasFetchedRef.current) return;
    
    const fetchCompanyId = async () => {
      hasFetchedRef.current = true;
      try {
        const employeeResponse = await employeesApi.getCurrentEmployee();
        const companyId = employeeResponse.response.companyId;
        if (companyId) {
          setCurrentCompanyId(companyId);
          setIsLoading(true);
          try {
            const response = await documentsApi.getPendingDocuments(companyId);
            setDocuments(response.response);
          } catch (error: unknown) {
            addToast({
              title: "Error",
              description: getErrorMessage(error),
              variant: "error",
            });
            setDocuments([]);
          } finally {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error: unknown) {
        addToast({
          title: "Error",
          description: getErrorMessage(error),
          variant: "error",
        });
        setIsLoading(false);
      }
    };
    fetchCompanyId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (id: string) => {
    if (!currentCompanyId) return;

    setProcessingIds((prev) => new Set(prev).add(id));
    try {
      await documentsApi.verifyDocument(id, currentCompanyId);
      addToast({
        title: t.toast.success,
        description: t.documents.documentVerifiedSuccessfully,
        variant: "success",
      });
      fetchPendingDocuments(currentCompanyId);
    } catch (error: unknown) {
      addToast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "error",
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleReject = async (id: string) => {
    if (!currentCompanyId) return;

    const reason = prompt("Please provide a rejection reason:");
    if (!reason || reason.trim() === "") {
      return;
    }

    setProcessingIds((prev) => new Set(prev).add(id));
    try {
      await documentsApi.rejectDocument(id, { rejectionReason: reason.trim() }, currentCompanyId);
      addToast({
        title: t.toast.success,
        description: t.documents.documentRejectedSuccessfully,
        variant: "success",
      });
      fetchPendingDocuments(currentCompanyId);
    } catch (error: unknown) {
      addToast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "error",
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
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

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pending Documents</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Review and verify or reject pending document submissions</p>
        </div>
        {currentCompanyId && (
          <Button onClick={() => fetchPendingDocuments(currentCompanyId)} variant="outline" isLoading={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Documents Awaiting Verification</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable />
          ) : documents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Employee</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Document Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">File Size</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Expiry Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Uploaded</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((document, index) => (
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerify(document.id)}
                            disabled={processingIds.has(document.id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {t.common.verify}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(document.id)}
                            disabled={processingIds.has(document.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="h-4 w-4 mr-1" />
                            {t.common.reject}
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
              title={t.documents.noPendingDocuments}
              description={t.documents.noPendingDocumentsDescription}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

