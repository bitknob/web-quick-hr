"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CompanyList } from "@/components/companies/company-list";
import { CompanyForm } from "@/components/companies/company-form";
import { Company } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type ViewMode = "list" | "create" | "edit" | "view";

export default function CompaniesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const handleCreateNew = () => {
    setViewMode("create");
    setSelectedCompany(null);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setViewMode("edit");
  };

  const handleView = (company: Company) => {
    setSelectedCompany(company);
    setViewMode("view");
  };

  const handleDelete = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (companyToDelete) {
      // The delete logic is handled in CompanyList component
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    }
  };

  const handleFormSuccess = () => {
    setViewMode("list");
    setSelectedCompany(null);
  };

  const handleCancel = () => {
    setViewMode("list");
    setSelectedCompany(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        {viewMode === "list" && (
          <CompanyList
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
          />
        )}

        {(viewMode === "create" || viewMode === "edit") && (
          <CompanyForm
            company={selectedCompany || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleCancel}
          />
        )}

        {viewMode === "view" && selectedCompany && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => setViewMode("list")}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← Back to Companies
              </button>
            </div>
            <CompanyList
              showActions={false}
              onView={() => {}}
            />
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Company"
        description={`Are you sure you want to delete "${companyToDelete?.name}"? This action cannot be undone and will set the company status to inactive.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

