"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Building2 } from "lucide-react";
import { companiesApi } from "@/lib/api/companies";
import { Company } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useTranslations } from "@/lib/hooks/use-translations";
import Link from "next/link";

const getCompanyInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

export default function CompaniesPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const t = useTranslations();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const hasFetchedRef = useRef(false);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      // Note: The API documentation doesn't show a list/search endpoint for companies
      // Attempting to use a standard REST endpoint - update this if your backend provides a different endpoint
      const response = await companiesApi.getCompanies({ searchTerm: searchTerm || undefined });
      setCompanies(response.response);
    } catch (error: unknown) {
      // If endpoint doesn't exist, show empty state
      setCompanies([]);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      // Only show error if it's not a 404 (endpoint not found)
      if (error instanceof Error && 'response' in error) {
        const status = (error as { response?: { status?: number } }).response?.status;
        if (status !== 404) {
          addToast({
            title: t.toast.error,
            description: errorMessage || t.companies.failedToFetchCompanies,
            variant: "error",
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, addToast, t.companies.failedToFetchCompanies, t.toast.error]);

  useEffect(() => {
    if (hasFetchedRef.current && searchTerm === "") return;
    
    const fetchData = async () => {
      if (!hasFetchedRef.current || searchTerm !== "") {
        hasFetchedRef.current = true;
        await fetchCompanies();
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t.companies.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t.companies.description}</p>
        </div>
        <Link href="/dashboard/companies/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t.companies.addCompany}
          </Button>
        </Link>
      </motion.div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder={t.companies.searchCompanies}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchCompanies()}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchCompanies}>{t.common.search}</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable />
          ) : companies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.companies.companyName}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.companies.companyCode}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.companies.companyDescription}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.common.status}</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company, index) => (
                    <motion.tr
                      key={company.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {company.profileImageUrl ? (
                            <div className="relative h-10 w-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                              <Image
                                src={company.profileImageUrl}
                                alt={company.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                              {getCompanyInitials(company.name)}
                            </div>
                          )}
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {company.name}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{company.code}</td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        {company.description || "-"}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            company.status === "active"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                              : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                          }`}
                        >
                          {company.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/companies/${company.id}`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Building2}
              title={t.companies.noCompaniesFound}
              description={t.companies.getStartedByCreating}
              action={{
                label: t.companies.addCompany,
                onClick: () => router.push("/dashboard/companies/new"),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

