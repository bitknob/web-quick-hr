"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Autocomplete, AutocompleteOption } from "@/components/ui/autocomplete";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { departmentsApi } from "@/lib/api/departments";
import { employeesApi } from "@/lib/api/employees";
import { companiesApi } from "@/lib/api/companies";
import { Company, Employee } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "@/lib/hooks/use-debounce";

const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  description: z.string().optional(),
  headId: z.string().optional(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentField {
  id: string;
  name: string;
  description: string;
  headId: string;
  headName: string;
}

const bulkDepartmentSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  departments: z.array(departmentSchema).min(1, "At least one department is required"),
});

type BulkDepartmentFormData = z.infer<typeof bulkDepartmentSchema>;

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
  const [employeeSearchTerms, setEmployeeSearchTerms] = useState<Record<string, string>>({});
  const debouncedEmployeeSearches = useDebounce(employeeSearchTerms, 300);

  const [departments, setDepartments] = useState<DepartmentField[]>([
    {
      id: "dept-1",
      name: "",
      description: "",
      headId: "",
      headName: "",
    },
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BulkDepartmentFormData>({
    resolver: zodResolver(bulkDepartmentSchema),
    defaultValues: {
      departments: [{ name: "", description: "", headId: "" }],
    },
  });

  const companyId = watch("companyId");

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

  // Search employees for a specific department
  const searchEmployeesForDepartment = useCallback(async (searchTerm: string, departmentId: string) => {
    if (!searchTerm || searchTerm.length < 2 || !companyId) {
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
        subtitle: `${employee.userCompEmail || employee.userEmail} - ${employee.jobTitle}`,
      }));
      setEmployeeOptions(options);
    } catch {
      setEmployeeOptions([]);
    } finally {
      setIsSearchingEmployees(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (debouncedCompanySearch) {
      searchCompanies(debouncedCompanySearch);
    } else {
      setCompanyOptions([]);
    }
  }, [debouncedCompanySearch]);

  useEffect(() => {
    const fetchCurrentEmployee = async () => {
      try {
        const response = await employeesApi.getCurrentEmployee();
        if (response.response && 'companyId' in response.response && response.response.companyId) {
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

  const addDepartment = () => {
    const newDepartment: DepartmentField = {
      id: `dept-${Date.now()}`,
      name: "",
      description: "",
      headId: "",
      headName: "",
    };
    setDepartments([...departments, newDepartment]);
    setValue("departments", [...departments, { name: "", description: "", headId: "" }]);
  };

  const removeDepartment = (departmentId: string) => {
    if (departments.length > 1) {
      const updatedDepartments = departments.filter(dept => dept.id !== departmentId);
      setDepartments(updatedDepartments);
      setValue("departments", updatedDepartments.map(dept => ({
        name: dept.name,
        description: dept.description,
        headId: dept.headId,
      })));
    }
  };

  const updateDepartment = (departmentId: string, field: keyof DepartmentField, value: string) => {
    const updatedDepartments = departments.map(dept => 
      dept.id === departmentId ? { ...dept, [field]: value } : dept
    );
    setDepartments(updatedDepartments);
    
    // Update form values
    const deptIndex = departments.findIndex(dept => dept.id === departmentId);
    if (deptIndex !== -1) {
      const currentFormValues = watch("departments") || [];
      const updatedFormValues = [...currentFormValues];
      updatedFormValues[deptIndex] = {
        ...updatedFormValues[deptIndex],
        [field]: value,
      };
      setValue("departments", updatedFormValues);
    }
  };

  const handleEmployeeSelect = (departmentId: string, option: AutocompleteOption | null) => {
    if (option) {
      updateDepartment(departmentId, "headId", option.id);
      updateDepartment(departmentId, "headName", option.label);
      setEmployeeSearchTerms({ ...employeeSearchTerms, [departmentId]: "" });
    } else {
      updateDepartment(departmentId, "headId", "");
      updateDepartment(departmentId, "headName", "");
      setEmployeeSearchTerms({ ...employeeSearchTerms, [departmentId]: "" });
    }
  };

  const handleEmployeeSearch = (departmentId: string, searchTerm: string) => {
    setEmployeeSearchTerms({ ...employeeSearchTerms, [departmentId]: searchTerm });
    searchEmployeesForDepartment(searchTerm, departmentId);
  };

  const onSubmit = async (data: BulkDepartmentFormData) => {
    setIsSaving(true);
    try {
      // Create all departments
      const promises = data.departments.map(dept =>
        departmentsApi.createDepartment({
          companyId: data.companyId,
          name: dept.name,
          description: dept.description || undefined,
          headId: dept.headId || undefined,
        })
      );

      await Promise.all(promises);

      addToast({
        title: "Success",
        description: `${data.departments.length} department(s) created successfully`,
        variant: "success",
      });
      router.push("/dashboard/departments");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? ((error as any).response?.data?.header?.responseMessage as string)
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to create departments",
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Departments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Add multiple departments to a company</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Company Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
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
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Departments</CardTitle>
              <Button onClick={addDepartment} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {departments.map((department, index) => (
                <div key={department.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Department {index + 1}</h3>
                    {departments.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDepartment(department.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Department Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="Engineering"
                        value={department.name}
                        onChange={(e) => updateDepartment(department.id, "name", e.target.value)}
                        className={!department.name ? "border-red-500" : ""}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Department Head
                      </label>
                      <Autocomplete
                        placeholder={companyId ? "Search for an employee..." : "Select company first"}
                        options={employeeOptions}
                        onSelect={(option) => handleEmployeeSelect(department.id, option)}
                        onSearch={(searchTerm) => handleEmployeeSearch(department.id, searchTerm)}
                        value={department.headId}
                        isLoading={isSearchingEmployees}
                        disabled={!companyId}
                        emptyMessage="No employees found. Try a different search term."
                      />
                      {!companyId && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Please select a company first to search for employees
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <Input
                        placeholder="Enter department description"
                        value={department.description}
                        onChange={(e) => updateDepartment(department.id, "description", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-4 flex items-center gap-4">
                <Button type="submit" isLoading={isSaving} disabled={!companyId || departments.some(dept => !dept.name)}>
                  <Save className="h-4 w-4 mr-2" />
                  Create {departments.length} Department{departments.length > 1 ? 's' : ''}
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

