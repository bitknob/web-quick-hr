"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, Building2, FolderTree, Menu, ArrowRight } from "lucide-react";
import { searchApi } from "@/lib/api/search";
import { SearchResult } from "@/lib/api/search";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useTranslations } from "@/lib/hooks/use-translations";
import { getErrorMessage } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/use-debounce";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  user: Users,
  employee: Users,
  building: Building2,
  company: Building2,
  sitemap: FolderTree,
  department: FolderTree,
  menu: Menu,
  users: Users,
};

function getIcon(iconName?: string) {
  if (!iconName) return Search;
  return iconMap[iconName.toLowerCase()] || Search;
}

const typeLabels: Record<string, string> = {
  employee: "Employees",
  company: "Companies",
  department: "Departments",
  menu: "Menu Items",
};

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [groupedResults, setGroupedResults] = useState<Record<string, SearchResult[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [byType, setByType] = useState<Record<string, number>>({});

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const performSearch = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      setGroupedResults({});
      setTotal(0);
      setByType({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await searchApi.globalSearch({
        q: term,
        limit: 50,
      });
      setResults(response.response.results);
      setTotal(response.response.total);
      setByType(response.response.byType);

      // Group results by type
      const grouped: Record<string, SearchResult[]> = {};
      response.response.results.forEach((result) => {
        if (!grouped[result.type]) {
          grouped[result.type] = [];
        }
        grouped[result.type].push(result);
      });
      setGroupedResults(grouped);
    } catch (error: unknown) {
      addToast({
        title: t.toast.error,
        description: getErrorMessage(error),
        variant: "error",
      });
      setResults([]);
      setGroupedResults({});
    } finally {
      setIsLoading(false);
    }
  }, [addToast, t.toast.error]);

  useEffect(() => {
    const queryTerm = searchParams.get("q");
    if (queryTerm) {
      setSearchTerm(queryTerm);
      performSearch(queryTerm);
    }
  }, [searchParams, performSearch]);

  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
      performSearch(debouncedSearchTerm);
      // Update URL without navigation
      const url = new URL(window.location.href);
      url.searchParams.set("q", debouncedSearchTerm);
      window.history.pushState({}, "", url.toString());
    }
  }, [debouncedSearchTerm, performSearch]);

  const handleResultClick = (result: SearchResult) => {
    router.push(result.path);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.length >= 2) {
      performSearch(searchTerm);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Search</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Search across employees, companies, departments, and more
        </p>
      </motion.div>

      <Card>
        <CardHeader>
          <form onSubmit={handleSearchSubmit}>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder={t.search.placeholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={searchTerm.length < 2}>
                Search
              </Button>
            </div>
          </form>
          {total > 0 && !isLoading && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Found {total} result{total !== 1 ? "s" : ""}
              {Object.keys(byType).length > 0 && (
                <>
                  {" ("}
                  {Object.entries(byType)
                    .map(([type, count]) => `${count} ${typeLabels[type] || type}`)
                    .join(", ")}
                  {")"}
                </>
              )}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable />
          ) : searchTerm.length < 2 ? (
            <EmptyState
              icon={Search}
              title={t.search.startSearching}
              description={t.search.enterAtLeastTwoCharacters}
            />
          ) : results.length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedResults).map(([type, typeResults]) => {
                const Icon = getIcon(typeResults[0]?.icon);
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-4">
                      <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1)} ({typeResults.length})
                      </h2>
                    </div>
                    <div className="space-y-2">
                      {typeResults.map((result, index) => (
                        <motion.div
                          key={`${result.type}-${result.id}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleResultClick(result)}
                          className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                              {result.title}
                            </p>
                            {result.subtitle && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title={t.common.noResults}
              description={`${t.search.noResultsFor} "${searchTerm}". ${t.search.tryDifferentSearchTerm}.`}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Search</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Search across employees, companies, departments, and more
          </p>
        </div>
        <Card>
          <CardContent className="py-12">
            <SkeletonTable />
          </CardContent>
        </Card>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}

