"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Autocomplete, AutocompleteOption } from "@/components/ui/autocomplete";
import { ArrowLeft, Save } from "lucide-react";
import { rolesApi } from "@/lib/api/roles";
import { companiesApi } from "@/lib/api/companies";
import { Company, Role } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "@/lib/hooks/use-debounce";

const availableMenuItems = [
  "dashboard",
  "companies",
  "employees",
  "departments",
  "approvals",
  "leave",
  "attendance",
  "profile",
  "settings",
  "roles",
];

const updateRoleSchema = z.object({
  name: z.string().min(1, "Role name is required").optional(),
  description: z.string().optional(),
  hierarchyLevel: z.number().min(1).max(8).optional(),
  parentRoleId: z.string().optional(),
  permissions: z.record(z.string(), z.unknown()).optional(),
  menuAccess: z.array(z.string()).optional(),
  canAccessAllCompanies: z.boolean().optional(),
  canAccessMultipleCompanies: z.boolean().optional(),
  canAccessSingleCompany: z.boolean().optional(),
  canManageCompanies: z.boolean().optional(),
  canCreateCompanies: z.boolean().optional(),
  canManageProviderStaff: z.boolean().optional(),
  canManageEmployees: z.boolean().optional(),
  canApproveLeaves: z.boolean().optional(),
  canViewPayroll: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<AutocompleteOption[]>([]);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const debouncedCompanySearch = useDebounce(companySearchTerm, 300);
  const [parentRoleOptions, setParentRoleOptions] = useState<AutocompleteOption[]>([]);
  const [isSearchingParentRoles, setIsSearchingParentRoles] = useState(false);
  const [parentRoleSearchTerm, setParentRoleSearchTerm] = useState("");
  const debouncedParentRoleSearch = useDebounce(parentRoleSearchTerm, 300);
  const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
    reset,
  } = useForm<UpdateRoleFormData>({
    resolver: zodResolver(updateRoleSchema),
  });

  const hierarchyLevel = watch("hierarchyLevel") || role?.hierarchyLevel || 8;
  const parentRoleId = watch("parentRoleId");

  useEffect(() => {
    if (params.id) {
      fetchRole(params.id as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchRole = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await rolesApi.getRole(id);
      const roleData = response.response;
      setRole(roleData);

      if (roleData.isSystemRole) {
        addToast({
          title: "Error",
          description: "System roles cannot be edited",
          variant: "error",
        });
        router.push(`/dashboard/roles/${id}`);
        return;
      }

      reset({
        name: roleData.name,
        description: roleData.description || "",
        hierarchyLevel: roleData.hierarchyLevel,
        parentRoleId: roleData.parentRoleId || undefined,
        canAccessAllCompanies: roleData.canAccessAllCompanies,
        canAccessMultipleCompanies: roleData.canAccessMultipleCompanies,
        canAccessSingleCompany: roleData.canAccessSingleCompany,
        canManageCompanies: roleData.canManageCompanies,
        canCreateCompanies: roleData.canCreateCompanies,
        canManageProviderStaff: roleData.canManageProviderStaff,
        canManageEmployees: roleData.canManageEmployees,
        canApproveLeaves: roleData.canApproveLeaves,
        canViewPayroll: roleData.canViewPayroll,
        isActive: roleData.isActive,
      });

      setSelectedMenuItems(roleData.menuAccess || []);

      // If there's a parent role, fetch it
      if (roleData.parentRoleId) {
        try {
          const parentResponse = await rolesApi.getRole(roleData.parentRoleId);
          const parent = parentResponse.response;
          setParentRoleOptions([
            {
              id: parent.id,
              label: parent.name,
              subtitle: `${parent.roleKey} - Level ${parent.hierarchyLevel}`,
            },
          ]);
          setParentRoleSearchTerm(parent.name);
        } catch {
          // Parent fetch failed
        }
      }

      // If there's a company, fetch it
      if (roleData.companyId) {
        try {
          const companyResponse = await companiesApi.getCompany(roleData.companyId);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to fetch role",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  // Search parent roles
  const searchParentRoles = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setParentRoleOptions([]);
      return;
    }

    setIsSearchingParentRoles(true);
    try {
      const response = await rolesApi.getRoles({
        isActive: true,
      });
      const filteredRoles = response.response.filter(
        (r: Role) =>
          r.hierarchyLevel < hierarchyLevel &&
          r.id !== role?.id &&
          r.id !== parentRoleId &&
          (r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.roleKey.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      const options: AutocompleteOption[] = filteredRoles.map((r: Role) => ({
        id: r.id,
        label: r.name,
        subtitle: `${r.roleKey} - Level ${r.hierarchyLevel}`,
      }));
      setParentRoleOptions(options);
    } catch {
      setParentRoleOptions([]);
    } finally {
      setIsSearchingParentRoles(false);
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
    if (debouncedParentRoleSearch) {
      searchParentRoles(debouncedParentRoleSearch);
    } else {
      setParentRoleOptions([]);
    }
  }, [debouncedParentRoleSearch, hierarchyLevel, parentRoleId, role?.id]);

  const handleParentRoleSelect = (option: AutocompleteOption | null) => {
    if (option) {
      setValue("parentRoleId", option.id, { shouldValidate: true });
      setParentRoleSearchTerm(option.label);
    } else {
      setValue("parentRoleId", undefined, { shouldValidate: true });
      setParentRoleSearchTerm("");
    }
  };

  const handleParentRoleSearch = (searchTerm: string) => {
    setParentRoleSearchTerm(searchTerm);
  };

  const toggleMenuItem = (menuItem: string) => {
    const newMenuItems = selectedMenuItems.includes(menuItem)
      ? selectedMenuItems.filter((item) => item !== menuItem)
      : [...selectedMenuItems, menuItem];
    setSelectedMenuItems(newMenuItems);
    setValue("menuAccess", newMenuItems);
  };

  const onSubmit = async (data: UpdateRoleFormData) => {
    if (!role) return;

    setIsSaving(true);
    try {
      await rolesApi.updateRole(role.id, {
        name: data.name,
        description: data.description,
        hierarchyLevel: data.hierarchyLevel,
        parentRoleId: data.parentRoleId,
        permissions: data.permissions || role.permissions,
        menuAccess: selectedMenuItems,
        canAccessAllCompanies: data.canAccessAllCompanies,
        canAccessMultipleCompanies: data.canAccessMultipleCompanies,
        canAccessSingleCompany: data.canAccessSingleCompany,
        canManageCompanies: data.canManageCompanies,
        canCreateCompanies: data.canCreateCompanies,
        canManageProviderStaff: data.canManageProviderStaff,
        canManageEmployees: data.canManageEmployees,
        canApproveLeaves: data.canApproveLeaves,
        canViewPayroll: data.canViewPayroll,
        isActive: data.isActive,
      });
      addToast({
        title: "Success",
        description: "Role updated successfully",
        variant: "success",
      });
      router.push(`/dashboard/roles/${role.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to update role",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading role...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Role not found</p>
        <Button onClick={() => router.push("/dashboard/roles")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Roles
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
        <Button variant="ghost" onClick={() => router.push(`/dashboard/roles/${role.id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Role</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{role.name}</p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="roleKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role Key
                  </label>
                  <Input
                    id="roleKey"
                    value={role.roleKey}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Role key cannot be changed after creation
                  </p>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role Name
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
                  <label htmlFor="hierarchyLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hierarchy Level
                  </label>
                  <Controller
                    name="hierarchyLevel"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                          setValue("parentRoleId", undefined);
                          setParentRoleSearchTerm("");
                        }}
                        error={!!errors.hierarchyLevel}
                      >
                        <option value={1}>Level 1 - Super Admin</option>
                        <option value={2}>Level 2 - Provider Admin</option>
                        <option value={3}>Level 3 - Provider HR Staff</option>
                        <option value={4}>Level 4 - HRBP</option>
                        <option value={5}>Level 5 - Company Admin</option>
                        <option value={6}>Level 6 - Department Head</option>
                        <option value={7}>Level 7 - Manager</option>
                        <option value={8}>Level 8 - Employee</option>
                      </Select>
                    )}
                  />
                  {errors.hierarchyLevel && (
                    <p className="text-sm text-red-500 mt-1">{errors.hierarchyLevel.message}</p>
                  )}
                </div>

                <div>
                  <Autocomplete
                    label="Parent Role (Optional)"
                    placeholder="Search for a parent role..."
                    options={parentRoleOptions}
                    onSelect={handleParentRoleSelect}
                    onSearch={handleParentRoleSearch}
                    value={parentRoleId}
                    isLoading={isSearchingParentRoles}
                    error={errors.parentRoleId?.message}
                    emptyMessage="No parent roles found. Must have lower hierarchy level."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Parent role must have a lower hierarchy level
                  </p>
                </div>

                {role.companyId && (
                  <div>
                    <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company ID
                    </label>
                    <Input
                      id="companyId"
                      value={role.companyId}
                      disabled
                      className="bg-gray-100 dark:bg-gray-800"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Company cannot be changed after creation
                    </p>
                  </div>
                )}
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
              <CardTitle>Access Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("canAccessAllCompanies")}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Access All Companies</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("canAccessMultipleCompanies")}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Access Multiple Companies</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("canAccessSingleCompany")}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Access Single Company</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("canManageCompanies")}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Manage Companies</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("canCreateCompanies")}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Create Companies</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("canManageProviderStaff")}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Manage Provider Staff</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("canManageEmployees")}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Manage Employees</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("canApproveLeaves")}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Approve Leaves</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("canViewPayroll")}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">View Payroll</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("isActive")}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Menu Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {availableMenuItems.map((menuItem) => (
                  <label key={menuItem} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMenuItems.includes(menuItem)}
                      onChange={() => toggleMenuItem(menuItem)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{menuItem}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-4"
        >
          <Button type="submit" isLoading={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/roles/${role.id}`)}
          >
            Cancel
          </Button>
        </motion.div>
      </form>
    </div>
  );
}

