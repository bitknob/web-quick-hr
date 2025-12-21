"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Autocomplete, AutocompleteOption } from "@/components/ui/autocomplete";
import { ArrowLeft, Save, Type, List, Search as SearchIcon, CheckSquare, Square, Info } from "lucide-react";
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

const newRoleSchema = z.object({
  roleKey: z.string().min(1, "Role key is required").max(50, "Role key must be 50 characters or less"),
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  hierarchyLevel: z.number().min(1).max(8),
  parentRoleId: z.string().optional(),
  companyId: z.string().optional(),
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
});

type NewRoleFormData = z.infer<typeof newRoleSchema>;

export default function NewRolePage() {
  const router = useRouter();
  const { addToast } = useToast();
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
  const [isLoadingFormData, setIsLoadingFormData] = useState(true);
  const [hierarchyContext, setHierarchyContext] = useState<Array<{ level: number; roles: Role[] }>>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<NewRoleFormData>({
    resolver: zodResolver(newRoleSchema),
    defaultValues: {
      hierarchyLevel: 8,
      canAccessSingleCompany: false,
      canManageEmployees: false,
      canApproveLeaves: false,
      canViewPayroll: false,
      menuAccess: [],
    },
  });

  const hierarchyLevel = watch("hierarchyLevel");
  const companyId = watch("companyId");
  const parentRoleId = watch("parentRoleId");
  
  // Watch all access control checkboxes
  const canAccessAllCompanies = watch("canAccessAllCompanies");
  const canAccessMultipleCompanies = watch("canAccessMultipleCompanies");
  const canAccessSingleCompany = watch("canAccessSingleCompany");
  const canManageCompanies = watch("canManageCompanies");
  const canCreateCompanies = watch("canCreateCompanies");
  const canManageProviderStaff = watch("canManageProviderStaff");
  const canManageEmployees = watch("canManageEmployees");
  const canApproveLeaves = watch("canApproveLeaves");
  const canViewPayroll = watch("canViewPayroll");

  // Check if all access control items are selected
  const allAccessControlSelected = 
    canAccessAllCompanies &&
    canAccessMultipleCompanies &&
    canAccessSingleCompany &&
    canManageCompanies &&
    canCreateCompanies &&
    canManageProviderStaff &&
    canManageEmployees &&
    canApproveLeaves &&
    canViewPayroll;

  // Check if all menu items are selected
  const allMenuItemsSelected = selectedMenuItems.length === availableMenuItems.length;

  // Toggle all access control checkboxes
  const toggleAllAccessControl = () => {
    const allSelected = allAccessControlSelected;
    setValue("canAccessAllCompanies", !allSelected);
    setValue("canAccessMultipleCompanies", !allSelected);
    setValue("canAccessSingleCompany", !allSelected);
    setValue("canManageCompanies", !allSelected);
    setValue("canCreateCompanies", !allSelected);
    setValue("canManageProviderStaff", !allSelected);
    setValue("canManageEmployees", !allSelected);
    setValue("canApproveLeaves", !allSelected);
    setValue("canViewPayroll", !allSelected);
  };

  // Toggle all menu items
  const toggleAllMenuItems = () => {
    if (allMenuItemsSelected) {
      setSelectedMenuItems([]);
      setValue("menuAccess", []);
    } else {
      setSelectedMenuItems([...availableMenuItems]);
      setValue("menuAccess", [...availableMenuItems]);
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

  // Load form data and defaults
  useEffect(() => {
    const loadFormData = async () => {
      setIsLoadingFormData(true);
      try {
        const [formDataResponse, hierarchyResponse] = await Promise.all([
          rolesApi.getCreateFormData(),
          rolesApi.getCreateHierarchy(),
        ]);

        const formData = formDataResponse.response;
        const hierarchy = hierarchyResponse.response.hierarchy || [];

        setHierarchyContext(hierarchy);

        // Set default values from API
        if (formData.defaults) {
          const defaults = formData.defaults;
          setValue("hierarchyLevel", defaults.hierarchyLevel);
          setValue("canAccessAllCompanies", defaults.canAccessAllCompanies);
          setValue("canAccessMultipleCompanies", defaults.canAccessMultipleCompanies);
          setValue("canAccessSingleCompany", defaults.canAccessSingleCompany);
          setValue("canManageCompanies", defaults.canManageCompanies);
          setValue("canCreateCompanies", defaults.canCreateCompanies);
          setValue("canManageProviderStaff", defaults.canManageProviderStaff);
          setValue("canManageEmployees", defaults.canManageEmployees);
          setValue("canApproveLeaves", defaults.canApproveLeaves);
          setValue("canViewPayroll", defaults.canViewPayroll);
          
          if (defaults.menuAccess) {
            setSelectedMenuItems(defaults.menuAccess);
          }
        }

        // Pre-populate parent roles from hierarchy for the current level
        if (hierarchy.length > 0 && formData.defaults?.hierarchyLevel) {
          const currentLevel = formData.defaults.hierarchyLevel;
          const eligibleParents: Role[] = [];
          
          hierarchy.forEach((levelData) => {
            if (levelData.level < currentLevel) {
              eligibleParents.push(...levelData.roles);
            }
          });

          const parentOptions: AutocompleteOption[] = eligibleParents.map((role: Role) => ({
            id: role.id,
            label: role.name,
            subtitle: `${role.roleKey} - Level ${role.hierarchyLevel}`,
          }));
          setParentRoleOptions(parentOptions);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error && 'response' in error 
          ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
          : undefined;
        addToast({
          title: "Error",
          description: errorMessage || "Failed to load form data",
          variant: "error",
        });
      } finally {
        setIsLoadingFormData(false);
      }
    };

    loadFormData();
  }, [setValue, addToast]);

  // Search parent roles
  const searchParentRoles = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      // Show available parent roles from hierarchy for current level
      if (hierarchyContext.length > 0 && hierarchyLevel) {
        const eligibleParents: Role[] = [];
        hierarchyContext.forEach((levelData) => {
          if (levelData.level < hierarchyLevel) {
            eligibleParents.push(...levelData.roles);
          }
        });

        const parentOptions: AutocompleteOption[] = eligibleParents.map((role: Role) => ({
          id: role.id,
          label: role.name,
          subtitle: `${role.roleKey} - Level ${role.hierarchyLevel}`,
        }));
        setParentRoleOptions(parentOptions);
      } else {
        setParentRoleOptions([]);
      }
      return;
    }

    setIsSearchingParentRoles(true);
    try {
      const response = await rolesApi.getRoles({
        isActive: true,
      });
      const filteredRoles = response.response.filter(
        (role: Role) =>
          role.hierarchyLevel < (hierarchyLevel || 8) &&
          role.id !== parentRoleId &&
          (role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            role.roleKey.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      const options: AutocompleteOption[] = filteredRoles.map((role: Role) => ({
        id: role.id,
        label: role.name,
        subtitle: `${role.roleKey} - Level ${role.hierarchyLevel}`,
      }));
      setParentRoleOptions(options);
    } catch {
      setParentRoleOptions([]);
    } finally {
      setIsSearchingParentRoles(false);
    }
  }, [hierarchyLevel, parentRoleId, hierarchyContext]);

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
      // When search is cleared, show eligible parents based on current hierarchy level
      if (hierarchyLevel && hierarchyContext.length > 0) {
        const eligibleParents: Role[] = [];
        hierarchyContext.forEach((levelData) => {
          if (levelData.level < hierarchyLevel) {
            eligibleParents.push(...levelData.roles);
          }
        });

        const parentOptions: AutocompleteOption[] = eligibleParents.map((role: Role) => ({
          id: role.id,
          label: role.name,
          subtitle: `${role.roleKey} - Level ${role.hierarchyLevel}`,
        }));
        setParentRoleOptions(parentOptions);
      } else {
        setParentRoleOptions([]);
      }
    }
  }, [debouncedParentRoleSearch, searchParentRoles, hierarchyLevel, hierarchyContext]);

  const handleCompanySelect = (option: AutocompleteOption | null) => {
    if (option) {
      setValue("companyId", option.id, { shouldValidate: true });
      setCompanySearchTerm(option.label);
    } else {
      setValue("companyId", undefined, { shouldValidate: true });
      setCompanySearchTerm("");
    }
  };

  const handleCompanySearch = (searchTerm: string) => {
    setCompanySearchTerm(searchTerm);
  };

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

  if (isLoadingFormData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading form data...</p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: NewRoleFormData) => {
    setIsSaving(true);
    try {
      const response = await rolesApi.createRole({
        roleKey: data.roleKey,
        name: data.name,
        description: data.description,
        hierarchyLevel: data.hierarchyLevel,
        parentRoleId: data.parentRoleId,
        companyId: data.companyId,
        permissions: data.permissions || {},
        menuAccess: selectedMenuItems,
        canAccessAllCompanies: data.canAccessAllCompanies || false,
        canAccessMultipleCompanies: data.canAccessMultipleCompanies || false,
        canAccessSingleCompany: data.canAccessSingleCompany || false,
        canManageCompanies: data.canManageCompanies || false,
        canCreateCompanies: data.canCreateCompanies || false,
        canManageProviderStaff: data.canManageProviderStaff || false,
        canManageEmployees: data.canManageEmployees || false,
        canApproveLeaves: data.canApproveLeaves || false,
        canViewPayroll: data.canViewPayroll || false,
      });
      addToast({
        title: "Success",
        description: "Role created successfully",
        variant: "success",
      });
      router.push(`/dashboard/roles/${response.response.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to create role",
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
        <Button variant="ghost" onClick={() => router.push("/dashboard/roles")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Role</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Add a new role to the system</p>
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
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="roleKey" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Type className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Role Key <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500 dark:text-blue-400 pointer-events-none z-10" />
                    <Input
                      id="roleKey"
                      placeholder="custom_manager"
                      {...register("roleKey")}
                      className={errors.roleKey ? "border-red-500 dark:border-red-500 pl-10 bg-blue-50/50 dark:bg-gray-800 border-2" : "pl-10 bg-blue-50/50 dark:bg-gray-800 border-2"}
                    />
                  </div>
                  {errors.roleKey && (
                    <p className="text-sm text-red-500 mt-1">{errors.roleKey.message}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Unique identifier (max 50 characters, lowercase, underscores)
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Type className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500 dark:text-blue-400 pointer-events-none z-10" />
                    <Input
                      id="name"
                      placeholder="Custom Manager"
                      {...register("name")}
                      className={errors.name ? "border-red-500 dark:border-red-500 pl-10 bg-blue-50/50 dark:bg-gray-800 border-2" : "pl-10 bg-blue-50/50 dark:bg-gray-800 border-2"}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Type className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Description
                  </label>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500 dark:text-blue-400 pointer-events-none z-10" />
                    <Input
                      id="description"
                      placeholder="Enter role description"
                      {...register("description")}
                      className="pl-10 bg-blue-50/50 dark:bg-gray-800 border-2"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="hierarchyLevel" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <List className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    Hierarchy Level <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="hierarchyLevel"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        onChange={(e) => {
                          const newLevel = Number(e.target.value);
                          field.onChange(newLevel);
                          setValue("parentRoleId", undefined);
                          setParentRoleSearchTerm("");
                          
                          // Update parent role options based on new level
                          if (hierarchyContext.length > 0) {
                            const eligibleParents: Role[] = [];
                            hierarchyContext.forEach((levelData) => {
                              if (levelData.level < newLevel) {
                                eligibleParents.push(...levelData.roles);
                              }
                            });

                            const parentOptions: AutocompleteOption[] = eligibleParents.map((role: Role) => ({
                              id: role.id,
                              label: role.name,
                              subtitle: `${role.roleKey} - Level ${role.hierarchyLevel}`,
                            }));
                            setParentRoleOptions(parentOptions);
                          }
                        }}
                        error={!!errors.hierarchyLevel}
                        className="bg-purple-50/50 dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600"
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
                  {hierarchyContext.length > 0 && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-800 dark:text-blue-300">
                          <p className="font-medium mb-1">Hierarchy Information:</p>
                          {hierarchyContext
                            .filter((level) => level.level < (hierarchyLevel || 1))
                            .map((level) => (
                              <p key={level.level} className="text-blue-700 dark:text-blue-400">
                                Level {level.level}: {level.roles.length} {level.roles.length === 1 ? "role" : "roles"} available as parent
                              </p>
                            ))}
                          {hierarchyContext.filter((level) => level.level < (hierarchyLevel || 1)).length === 0 && (
                            <p className="text-blue-700 dark:text-blue-400">No parent roles available for this level</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <SearchIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    Parent Role (Optional)
                  </div>
                  <div className="border-2 border-green-300 dark:border-green-600 rounded-lg bg-green-50/30 dark:bg-gray-800 p-1">
                    <Autocomplete
                      placeholder="Search for a parent role..."
                      options={parentRoleOptions}
                      onSelect={handleParentRoleSelect}
                      onSearch={handleParentRoleSearch}
                      value={parentRoleId}
                      isLoading={isSearchingParentRoles}
                      error={errors.parentRoleId?.message}
                      emptyMessage="No parent roles found. Must have lower hierarchy level."
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Parent role must have a lower hierarchy level
                  </p>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <SearchIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    Company (Optional)
                  </div>
                  <div className="border-2 border-green-300 dark:border-green-600 rounded-lg bg-green-50/30 dark:bg-gray-800 p-1">
                    <Autocomplete
                      placeholder="Search for a company..."
                      options={companyOptions}
                      onSelect={handleCompanySelect}
                      onSearch={handleCompanySearch}
                      value={companyId}
                      isLoading={isSearchingCompanies}
                      error={errors.companyId?.message}
                      emptyMessage="No companies found. Leave empty for system-wide role."
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Leave empty for system-wide role
                  </p>
                </div>
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
                <CardTitle>Access Control</CardTitle>
                <button
                  type="button"
                  onClick={toggleAllAccessControl}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  {allAccessControlSelected ? (
                    <>
                      <CheckSquare className="h-4 w-4" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4" />
                      Select All
                    </>
                  )}
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    {...register("canAccessAllCompanies")}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Access All Companies</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    {...register("canAccessMultipleCompanies")}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Access Multiple Companies</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    {...register("canAccessSingleCompany")}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Access Single Company</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    {...register("canManageCompanies")}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Manage Companies</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    {...register("canCreateCompanies")}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Create Companies</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    {...register("canManageProviderStaff")}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Manage Provider Staff</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    {...register("canManageEmployees")}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Manage Employees</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    {...register("canApproveLeaves")}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Approve Leaves</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    {...register("canViewPayroll")}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View Payroll</span>
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
              <div className="flex items-center justify-between">
                <CardTitle>Menu Access</CardTitle>
                <button
                  type="button"
                  onClick={toggleAllMenuItems}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  {allMenuItemsSelected ? (
                    <>
                      <CheckSquare className="h-4 w-4" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4" />
                      Select All
                    </>
                  )}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {availableMenuItems.map((menuItem) => (
                  <label key={menuItem} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedMenuItems.includes(menuItem)}
                      onChange={() => toggleMenuItem(menuItem)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{menuItem}</span>
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
            Create Role
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/roles")}
          >
            Cancel
          </Button>
        </motion.div>
      </form>
    </div>
  );
}

