"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Autocomplete, AutocompleteOption } from "@/components/ui/autocomplete";
import { ArrowLeft, Save } from "lucide-react";
import { departmentsApi } from "@/lib/api/departments";
import { employeesApi } from "@/lib/api/employees";
import { Department, Employee } from "@/lib/types";
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

export default function DepartmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [employeeOptions, setEmployeeOptions] = useState<AutocompleteOption[]>([]);
  const [isSearchingEmployees, setIsSearchingEmployees] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const debouncedEmployeeSearch = useDebounce(employeeSearchTerm, 300);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
  });

  const headId = watch("headId");

  // Search employees
  const searchEmployees = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2 || !department?.companyId) {
      setEmployeeOptions([]);
      return;
    }

    setIsSearchingEmployees(true);
    try {
      const response = await employeesApi.searchEmployees({
        searchTerm,
        limit: 20,
        companyId: department.companyId,
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
    if (debouncedEmployeeSearch && department?.companyId) {
      searchEmployees(debouncedEmployeeSearch);
    } else {
      setEmployeeOptions([]);
    }
  }, [debouncedEmployeeSearch, department?.companyId]);

  useEffect(() => {
    if (params.id) {
      fetchDepartment(params.id as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchDepartment = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await departmentsApi.getDepartment(id);
      setDepartment(response.response);
      reset({
        name: response.response.name,
        description: response.response.description || "",
        headId: response.response.headId || "",
      });

      // If there's a head, fetch their details and set in options
      if (response.response.headId) {
        try {
          const headResponse = await employeesApi.getEmployee(response.response.headId);
          const head = headResponse.response;
          setEmployeeOptions([
            {
              id: head.id,
              label: `${head.firstName} ${head.lastName}`,
              subtitle: `${head.email} - ${head.jobTitle}`,
            },
          ]);
          setEmployeeSearchTerm(`${head.firstName} ${head.lastName}`);
        } catch {
          // Head fetch failed
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch department",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: DepartmentFormData) => {
    if (!department) return;

    setIsSaving(true);
    try {
      await departmentsApi.updateDepartment(department.id, {
        name: data.name,
        description: data.description || undefined,
        headId: data.headId || undefined,
      });
      addToast({
        title: "Success",
        description: "Department updated successfully",
        variant: "success",
      });
      fetchDepartment(department.id);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to update department",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading department...</p>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Department not found</p>
        <Button onClick={() => router.push("/dashboard/departments")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Departments
        </Button>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {department.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Department Details</p>
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
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department Name
                  </label>
                  <Input
                    id="name"
                    {...register("name")}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company ID
                  </label>
                  <Input
                    id="companyId"
                    value={department.companyId}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Company cannot be changed after creation
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <Input
                    id="description"
                    {...register("description")}
                  />
                </div>

                <div>
                  <Autocomplete
                    label="Department Head"
                    placeholder="Search for an employee..."
                    options={employeeOptions}
                    onSelect={handleEmployeeSelect}
                    onSearch={handleEmployeeSearch}
                    value={headId}
                    isLoading={isSearchingEmployees}
                    error={errors.headId?.message}
                    emptyMessage="No employees found. Try a different search term."
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" isLoading={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

