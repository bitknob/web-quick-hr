"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Autocomplete, AutocompleteOption } from "@/components/ui/autocomplete";
import { ArrowLeft, Save, ChevronDown, ChevronUp } from "lucide-react";
import { payrollApi, CreatePayslipTemplateRequest } from "@/lib/api/payroll";
import { companiesApi } from "@/lib/api/companies";
import { Company } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "@/lib/hooks/use-debounce";

const payslipTemplateSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  templateName: z.string().min(1, "Template name is required"),
  templateType: z.enum(["simple", "detailed", "custom"]),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type PayslipTemplateFormData = z.infer<typeof payslipTemplateSchema>;

export default function NewPayslipTemplatePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<AutocompleteOption[]>([]);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(companySearchTerm, 300);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["basic", "header", "footer", "sections", "styling", "branding", "watermark"])
  );

  // Configuration states
  const [headerConfig, setHeaderConfig] = useState({
    showCompanyLogo: true,
    showCompanyName: true,
    showEmployeeInfo: true,
    showPayslipNumber: true,
    showPeriod: true,
  });

  const [footerConfig, setFooterConfig] = useState({
    showDisclaimer: true,
    disclaimerText: "This is a system-generated payslip.",
    showSignature: true,
  });

  const [stylingConfig, setStylingConfig] = useState({
    primaryColor: "#2563eb",
    secondaryColor: "#1e40af",
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
  });

  const [sectionsConfig, setSectionsConfig] = useState({
    showEarnings: true,
    showDeductions: true,
    showTaxDetails: true,
    showSummary: true,
    showYTD: true,
    showAttendance: false,
    showVariablePay: true,
    showArrears: true,
    showLoans: true,
  });

  const [watermarkSettings, setWatermarkSettings] = useState({
    enabled: false,
    text: "CONFIDENTIAL",
    opacity: 0.1,
  });

  const [brandingSettings, setBrandingSettings] = useState({
    companyName: "",
    logoUrl: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PayslipTemplateFormData>({
    resolver: zodResolver(payslipTemplateSchema),
    defaultValues: {
      templateType: "detailed",
      isDefault: false,
    },
  });

  const companyId = watch("companyId");
  const templateType = watch("templateType");

  // Search companies
  const searchCompanies = useCallback(async (searchTerm: string) => {
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
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchCompanies(debouncedSearchTerm);
    } else {
      setCompanyOptions([]);
    }
  }, [debouncedSearchTerm, searchCompanies]);

  // Update branding company name when company is selected
  useEffect(() => {
    if (companyId) {
      const selectedCompany = companyOptions.find((c) => c.id === companyId);
      if (selectedCompany) {
        setBrandingSettings((prev) => ({ ...prev, companyName: selectedCompany.label }));
      }
    }
  }, [companyId, companyOptions]);

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

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const renderSectionHeader = (title: string, sectionKey: string) => {
    const isExpanded = expandedSections.has(sectionKey);
    return (
      <button
        type="button"
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between"
      >
        <CardTitle>{title}</CardTitle>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
    );
  };

  const onSubmit = async (data: PayslipTemplateFormData) => {
    setIsSaving(true);
    try {
      const requestData: CreatePayslipTemplateRequest = {
        companyId: data.companyId,
        templateName: data.templateName,
        templateType: data.templateType,
        description: data.description,
        isDefault: data.isDefault,
        headerConfiguration: headerConfig,
        footerConfiguration: footerConfig,
        bodyConfiguration: {
          layout: "standard",
        },
        stylingConfiguration: stylingConfig,
        sectionsConfiguration: sectionsConfig,
        watermarkSettings: watermarkSettings.enabled ? watermarkSettings : undefined,
        brandingSettings: {
          companyName: brandingSettings.companyName,
          logoUrl: brandingSettings.logoUrl,
        },
      };

      await payrollApi.createPayslipTemplate(requestData);
      addToast({
        title: "Success",
        description: "Payslip template created successfully",
        variant: "success",
      });
      router.push("/dashboard/payroll/payslip-templates");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to create payslip template",
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
        <Button variant="ghost" onClick={() => router.push("/dashboard/payroll/payslip-templates")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Payslip Template</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Customize payslip appearance and content</p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              {renderSectionHeader("Basic Information", "basic")}
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("basic") && (
                <CardContent className="space-y-4">
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
                      />
                    </div>

                    <div>
                      <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Template Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="templateName"
                        placeholder="e.g., Company Standard Template"
                        {...register("templateName")}
                        className={errors.templateName ? "border-red-500" : ""}
                      />
                      {errors.templateName && (
                        <p className="text-sm text-red-500 mt-1">{errors.templateName.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="templateType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Template Type <span className="text-red-500">*</span>
                      </label>
                      <Select
                        id="templateType"
                        {...register("templateType")}
                        className={errors.templateType ? "border-red-500" : ""}
                      >
                        <option value="simple">Simple</option>
                        <option value="detailed">Detailed</option>
                        <option value="custom">Custom</option>
                      </Select>
                      {errors.templateType && (
                        <p className="text-sm text-red-500 mt-1">{errors.templateType.message}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        {...register("isDefault")}
                        className="w-4 h-4 rounded"
                        id="isDefault"
                      />
                      <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                        Set as default template
                      </label>
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <Input
                        id="description"
                        placeholder="Brief description of this template"
                        {...register("description")}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Header Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              {renderSectionHeader("Header Configuration", "header")}
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("header") && (
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(headerConfig).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value as boolean}
                          onChange={(e) =>
                            setHeaderConfig((prev) => ({ ...prev, [key]: e.target.checked }))
                          }
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Footer Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              {renderSectionHeader("Footer Configuration", "footer")}
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("footer") && (
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={footerConfig.showDisclaimer}
                      onChange={(e) =>
                        setFooterConfig((prev) => ({ ...prev, showDisclaimer: e.target.checked }))
                      }
                      className="w-4 h-4 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show Disclaimer
                    </label>
                  </div>

                  {footerConfig.showDisclaimer && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Disclaimer Text
                      </label>
                      <Input
                        value={footerConfig.disclaimerText}
                        onChange={(e) =>
                          setFooterConfig((prev) => ({ ...prev, disclaimerText: e.target.value }))
                        }
                        placeholder="This is a system-generated payslip."
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={footerConfig.showSignature}
                      onChange={(e) =>
                        setFooterConfig((prev) => ({ ...prev, showSignature: e.target.checked }))
                      }
                      className="w-4 h-4 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show Signature
                    </label>
                  </div>
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Sections Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              {renderSectionHeader("Sections Configuration", "sections")}
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("sections") && (
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(sectionsConfig).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value as boolean}
                          onChange={(e) =>
                            setSectionsConfig((prev) => ({ ...prev, [key]: e.target.checked }))
                          }
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Styling Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              {renderSectionHeader("Styling Configuration", "styling")}
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("styling") && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Primary Color
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={stylingConfig.primaryColor}
                          onChange={(e) =>
                            setStylingConfig((prev) => ({ ...prev, primaryColor: e.target.value }))
                          }
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={stylingConfig.primaryColor}
                          onChange={(e) =>
                            setStylingConfig((prev) => ({ ...prev, primaryColor: e.target.value }))
                          }
                          placeholder="#2563eb"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Secondary Color
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={stylingConfig.secondaryColor}
                          onChange={(e) =>
                            setStylingConfig((prev) => ({ ...prev, secondaryColor: e.target.value }))
                          }
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={stylingConfig.secondaryColor}
                          onChange={(e) =>
                            setStylingConfig((prev) => ({ ...prev, secondaryColor: e.target.value }))
                          }
                          placeholder="#1e40af"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Font Family
                      </label>
                      <Input
                        value={stylingConfig.fontFamily}
                        onChange={(e) =>
                          setStylingConfig((prev) => ({ ...prev, fontFamily: e.target.value }))
                        }
                        placeholder="Arial, sans-serif"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Font Size
                      </label>
                      <Input
                        value={stylingConfig.fontSize}
                        onChange={(e) =>
                          setStylingConfig((prev) => ({ ...prev, fontSize: e.target.value }))
                        }
                        placeholder="12px"
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Branding Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              {renderSectionHeader("Branding Settings", "branding")}
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("branding") && (
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company Name
                    </label>
                    <Input
                      value={brandingSettings.companyName}
                      onChange={(e) =>
                        setBrandingSettings((prev) => ({ ...prev, companyName: e.target.value }))
                      }
                      placeholder="Company Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Logo URL
                    </label>
                    <Input
                      value={brandingSettings.logoUrl}
                      onChange={(e) =>
                        setBrandingSettings((prev) => ({ ...prev, logoUrl: e.target.value }))
                      }
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Watermark Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              {renderSectionHeader("Watermark Settings", "watermark")}
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("watermark") && (
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={watermarkSettings.enabled}
                      onChange={(e) =>
                        setWatermarkSettings((prev) => ({ ...prev, enabled: e.target.checked }))
                      }
                      className="w-4 h-4 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Enable Watermark
                    </label>
                  </div>

                  {watermarkSettings.enabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Watermark Text
                        </label>
                        <Input
                          value={watermarkSettings.text}
                          onChange={(e) =>
                            setWatermarkSettings((prev) => ({ ...prev, text: e.target.value }))
                          }
                          placeholder="CONFIDENTIAL"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Opacity (0-1)
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={watermarkSettings.opacity}
                          onChange={(e) =>
                            setWatermarkSettings((prev) => ({
                              ...prev,
                              opacity: parseFloat(e.target.value) || 0.1,
                            }))
                          }
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-end gap-4"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/payroll/payslip-templates")}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Payslip Template
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}

