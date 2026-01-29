"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { CompanyCard } from "./company-card";
import { Company } from "@/lib/types";
import { companiesApi, SearchCompaniesParams } from "@/lib/api/companies";
import { useToast } from "@/components/ui/toast";

interface CompanyListProps {
  onEdit?: (company: Company) => void;
  onDelete?: (company: Company) => void;
  onView?: (company: Company) => void;
  onCreateNew?: () => void;
  showActions?: boolean;
}

export function CompanyList({ 
  onEdit, 
  onDelete, 
  onView, 
  onCreateNew,
  showActions = true 
}: CompanyListProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { addToast } = useToast();

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params: SearchCompaniesParams = {
        page: currentPage,
        limit: 12,
      };

      if (searchTerm) params.searchTerm = searchTerm;
      if (statusFilter) params.status = statusFilter as "active" | "inactive";
      if (subscriptionFilter) params.subscriptionStatus = subscriptionFilter as any;

      const response = await companiesApi.getCompanies(params);
      setCompanies(response.response);
      
      // Calculate total pages (assuming API returns total count in headers or response)
      // This is a placeholder - adjust based on your API response structure
      setTotalPages(Math.ceil(response.response.length / 12));
    } catch (error) {
      console.error("Failed to fetch companies:", error);
      addToast({
        title: "Error",
        description: "Failed to load companies",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [currentPage, searchTerm, statusFilter, subscriptionFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSubscriptionFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSubscriptionFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (company: Company) => {
    if (!onDelete) return;
    
    try {
      await companiesApi.deleteCompany(company.id);
      addToast({
        title: "Success",
        description: "Company deleted successfully",
        variant: "success",
      });
      fetchCompanies(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete company:", error);
      addToast({
        title: "Error",
        description: "Failed to delete company",
        variant: "error",
      });
    }
    
    onDelete(company);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Companies
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and monitor all companies
          </p>
        </div>
        
        {onCreateNew && (
          <Button onClick={onCreateNew} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Company
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <Select
              value={statusFilter}
              onChange={handleStatusFilter}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>

          {/* Subscription Filter */}
          <div className="w-full lg:w-48">
            <Select
              value={subscriptionFilter}
              onChange={handleSubscriptionFilter}
            >
              <option value="">All Subscriptions</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="expired">Expired</option>
            </Select>
          </div>

          {/* Clear Filters */}
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("");
              setSubscriptionFilter("");
              setCurrentPage(1);
            }}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Results */}
      {companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies found"
          description={
            searchTerm || statusFilter || subscriptionFilter
              ? "Try adjusting your search or filters"
              : "Get started by adding your first company"
          }
          action={
            onCreateNew && !searchTerm && !statusFilter && !subscriptionFilter
              ? {
                  label: "Add Company",
                  onClick: onCreateNew
                }
              : undefined
          }
        />
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {companies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onEdit={onEdit}
                onDelete={onDelete ? (company) => handleDelete(company) : undefined}
                onView={onView}
                showActions={showActions}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
