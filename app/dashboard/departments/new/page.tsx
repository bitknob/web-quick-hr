"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Autocomplete, AutocompleteOption } from "@/components/ui/autocomplete";
import { ArrowLeft, Save } from "lucide-react";
import { departmentsApi } from "@/lib/api/departments";
import { employeesApi } from "@/lib/api/employees";
import { companiesApi } from "@/lib/api/companies";
import { Company, Employee } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "@/lib/hooks/use-debounce";

const newDepartmentSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  name: z.string().min(1, "Department name is required"),
  description: z.string().optional(),
  headId: z.string().optional(),
});

type NewDepartmentFormData = z.infer<typeof newDepartmentSchema>;

export default function NewDepartmentPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<AutocompleteOption[]>([]);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const debouncedCompanySearch = useDebounce(companySearchTerm, 300);

  const [employeeOptions, setEmployeeOptions] = useState<AutocompleteOption[]>([]);
  const [isSearchingEmployees, setIsSearchingEmployees] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const debouncedEmployeeSearch = useDebounce(employeeSearchTerm, 300);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<NewDepartmentFormData>({
    resolver: zodResolver(newDepartmentSchema),
  });

  const companyId = watch("companyId");
  const headId = watch("headId");

  // Search companies
  const searchCompanies = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setCompanyOptions([]);
      return;
    }

    setIsSearchingCompanies(true);
    try {
      const response = await companiesApi.getCompanies({
        searchTerm,
        limit: 20,
        status: "active",
      });
      const options: AutocompleteOption[] = response.response.map((company: Company) => ({
        id: company.id,
        label: company.name,
        subtitle: `${company.code}${company.description ? ` - ${company.description}` : ""}`,
        imageUrl: company.profileImageUrl,
      }));
      setCompanyOptions(options);
    } catch {
      setCompanyOptions([]);
    } finally {
      setIsSearchingCompanies(false);
    }
  };

  // Search employees
  const searchEmployees = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2 || !companyId) {
      setEmployeeOptions([]);
      return;
    }

    setIsSearchingEmployees(true);
    try {
      const response = await employeesApi.searchEmployees({
        searchTerm,
        limit: 20,
        companyId,
      });
      const options: AutocompleteOption[] = response.response.map((employee: Employee) => ({
        id: employee.id,
        label: `${employee.firstName} ${employee.lastName}`,
        subtitle: `${employee.email} - ${employee.jobTitle}`,
      }));
      setEmployeeOptions(options);
    } catch {
      setEmployeeOptions([]);
    } finally {
      setIsSearchingEmployees(false);
    }
  };

  useEffect(() => {
    if (debouncedCompanySearch) {
      searchCompanies(debouncedCompanySearch);
    } else {
      setCompanyOptions([]);
    }
  }, [debouncedCompanySearch]);

  useEffect(() => {
    if (debouncedEmployeeSearch && companyId) {
      searchEmployees(debouncedEmployeeSearch);
    } else {
      setEmployeeOptions([]);
    }
  }, [debouncedEmployeeSearch, companyId]);

  useEffect(() => {
    const fetchCurrentEmployee = async () => {
      try {
        const response = await employeesApi.getCurrentEmployee();
        if (response.response?.companyId) {
          setValue("companyId", response.response.companyId);
          try {
            const companyResponse = await companiesApi.getCompany(response.response.companyId);
            const company = companyResponse.response;
            setCompanyOptions([
              {
                id: company.id,
                label: company.name,
                subtitle: `${company.code}${company.description ? ` - ${company.description}` : ""}`,
                imageUrl: company.profileImageUrl,
              },
            ]);
            setCompanySearchTerm(company.name);
          } catch {
            // Company fetch failed
          }
        }
      } catch {
        // Silently fail
      }
    };
    fetchCurrentEmployee();
  }, [setValue]);

  const handleCompanySelect = (option: AutocompleteOption | null) => {
    if (option) {
      setValue("companyId", option.id, { shouldValidate: true });
      setCompanySearchTerm(option.label);
    } else {
      setValue("companyId", "", { shouldValidate: true });
      setCompanySearchTerm("");
    }
  };

  const handleCompanySearch = (searchTerm: string) => {
    setCompanySearchTerm(searchTerm);
  };

  const handleEmployeeSelect = (option: AutocompleteOption | null) => {
    if (option) {
      setValue("headId", option.id, { shouldValidate: true });
      setEmployeeSearchTerm(option.label);
    } else {
      setValue("headId", "", { shouldValidate: true });
      setEmployeeSearchTerm("");
    }
  };

  const handleEmployeeSearch = (searchTerm: string) => {
    setEmployeeSearchTerm(searchTerm);
  };

  const onSubmit = async (data: NewDepartmentFormData) => {
    setIsSaving(true);
    try {
      const response = await departmentsApi.createDepartment({
        companyId: data.companyId,
        name: data.name,
        description: data.description || undefined,
        headId: data.headId || undefined,
      });
      addToast({
        title: "Success",
        description: "Department created successfully",
        variant: "success",
      });
      router.push(`/dashboard/departments/${response.response.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to create department",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" onClick={() => router.push("/dashboard/departments")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Department</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Add a new department to the system</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Department Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Autocomplete
                    label="Company"
                    placeholder="Search for a company..."
                    options={companyOptions}
                    onSelect={handleCompanySelect}
                    onSearch={handleCompanySearch}
                    value={companyId}
                    isLoading={isSearchingCompanies}
                    required
                    error={errors.companyId?.message}
                    emptyMessage="No companies found. Try a different search term."
                  />
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    placeholder="Engineering"
                    {...register("name")}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <Input
                    id="description"
                    placeholder="Enter department description"
                    {...register("description")}
                  />
                </div>

                <div>
                  <Autocomplete
                    label="Department Head"
                    placeholder={companyId ? "Search for an employee..." : "Select company first"}
                    options={employeeOptions}
                    onSelect={handleEmployeeSelect}
                    onSearch={handleEmployeeSearch}
                    value={headId}
                    isLoading={isSearchingEmployees}
                    disabled={!companyId}
                    error={errors.headId?.message}
                    emptyMessage="No employees found. Try a different search term."
                  />
                  {!companyId && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Please select a company first to search for employees
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Button type="submit" isLoading={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Create Department
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/departments")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

