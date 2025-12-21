"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Autocomplete, AutocompleteOption } from "@/components/ui/autocomplete";
import { ArrowLeft, Save, ChevronDown, ChevronUp, X } from "lucide-react";
import { payrollApi, CreatePayslipScheduleRequest } from "@/lib/api/payroll";
import { companiesApi } from "@/lib/api/companies";
import { Company } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "@/lib/hooks/use-debounce";

const payslipScheduleSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  scheduleName: z.string().min(1, "Schedule name is required"),
  description: z.string().optional(),
  frequency: z.enum(["monthly", "biweekly", "weekly", "custom"]),
  generationDay: z.number().optional(),
  generationTime: z.string().min(1, "Generation time is required"),
  timezone: z.string().min(1, "Timezone is required"),
  triggerType: z.enum(["scheduled", "manual"]),
  autoApprove: z.boolean().optional(),
  autoSend: z.boolean().optional(),
});

type PayslipScheduleFormData = z.infer<typeof payslipScheduleSchema>;

const timezones = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Australia/Sydney",
  "Asia/Tokyo",
  "Asia/Hong_Kong",
];

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function NewPayslipSchedulePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<AutocompleteOption[]>([]);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(companySearchTerm, 300);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["basic", "schedule", "automation", "email", "notification", "periods"])
  );

  const currentYear = new Date().getFullYear();
  const [enabledMonths, setEnabledMonths] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const [enabledYears, setEnabledYears] = useState<number[]>([currentYear, currentYear + 1]);
  const [excludedDates, setExcludedDates] = useState<string[]>([]);
  const [newExcludedDate, setNewExcludedDate] = useState("");

  const [emailConfig, setEmailConfig] = useState({
    sendToEmployees: true,
    sendToHR: true,
    ccEmails: [] as string[],
  });
  const [newCcEmail, setNewCcEmail] = useState("");

  const [notificationConfig, setNotificationConfig] = useState({
    sendNotifications: true,
    notificationChannels: ["email"] as string[],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PayslipScheduleFormData>({
    resolver: zodResolver(payslipScheduleSchema),
    defaultValues: {
      frequency: "monthly",
      generationDay: 5,
      generationTime: "09:00",
      timezone: "Asia/Kolkata",
      triggerType: "scheduled",
      autoApprove: false,
      autoSend: false,
    },
  });

  const companyId = watch("companyId");
  const frequency = watch("frequency");

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

  const toggleMonth = (month: number) => {
    setEnabledMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month].sort((a, b) => a - b)
    );
  };

  const toggleYear = (year: number) => {
    setEnabledYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year].sort((a, b) => a - b)
    );
  };

  const addExcludedDate = () => {
    if (newExcludedDate && !excludedDates.includes(newExcludedDate)) {
      setExcludedDates((prev) => [...prev, newExcludedDate]);
      setNewExcludedDate("");
    }
  };

  const removeExcludedDate = (date: string) => {
    setExcludedDates((prev) => prev.filter((d) => d !== date));
  };

  const addCcEmail = () => {
    if (newCcEmail && !emailConfig.ccEmails.includes(newCcEmail)) {
      setEmailConfig((prev) => ({ ...prev, ccEmails: [...prev.ccEmails, newCcEmail] }));
      setNewCcEmail("");
    }
  };

  const removeCcEmail = (email: string) => {
    setEmailConfig((prev) => ({ ...prev, ccEmails: prev.ccEmails.filter((e) => e !== email) }));
  };

  const toggleNotificationChannel = (channel: string) => {
    setNotificationConfig((prev) => ({
      ...prev,
      notificationChannels: prev.notificationChannels.includes(channel)
        ? prev.notificationChannels.filter((c) => c !== channel)
        : [...prev.notificationChannels, channel],
    }));
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

  const onSubmit = async (data: PayslipScheduleFormData) => {
    setIsSaving(true);
    try {
      const requestData: CreatePayslipScheduleRequest = {
        companyId: data.companyId,
        scheduleName: data.scheduleName,
        description: data.description,
        frequency: data.frequency,
        generationDay: data.generationDay,
        generationTime: data.generationTime,
        timezone: data.timezone,
        triggerType: data.triggerType,
        autoApprove: data.autoApprove,
        autoSend: data.autoSend,
        emailConfiguration: {
          sendToEmployees: emailConfig.sendToEmployees,
          sendToHR: emailConfig.sendToHR,
          ccEmails: emailConfig.ccEmails,
        },
        notificationConfiguration: {
          sendNotifications: notificationConfig.sendNotifications,
          notificationChannels: notificationConfig.notificationChannels,
        },
        enabledMonths: enabledMonths.length > 0 ? enabledMonths : undefined,
        enabledYears: enabledYears.length > 0 ? enabledYears : undefined,
        excludedDates: excludedDates.length > 0 ? excludedDates : undefined,
      };

      await payrollApi.createPayslipSchedule(requestData);
      addToast({
        title: "Success",
        description: "Payslip schedule created successfully",
        variant: "success",
      });
      router.push("/dashboard/payroll/payslip-schedules");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { header?: { responseMessage?: string } } } }).response?.data?.header?.responseMessage
        : undefined;
      addToast({
        title: "Error",
        description: errorMessage || "Failed to create payslip schedule",
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
        <Button variant="ghost" onClick={() => router.push("/dashboard/payroll/payslip-schedules")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Payslip Schedule</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Automate payslip generation with scheduled runs</p>
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
                      <label htmlFor="scheduleName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Schedule Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="scheduleName"
                        placeholder="e.g., Monthly Payslip Generation"
                        {...register("scheduleName")}
                        className={errors.scheduleName ? "border-red-500" : ""}
                      />
                      {errors.scheduleName && (
                        <p className="text-sm text-red-500 mt-1">{errors.scheduleName.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <Input
                        id="description"
                        placeholder="Brief description of this schedule"
                        {...register("description")}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Schedule Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              {renderSectionHeader("Schedule Configuration", "schedule")}
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("schedule") && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Frequency <span className="text-red-500">*</span>
                      </label>
                      <Select
                        id="frequency"
                        {...register("frequency")}
                        className={errors.frequency ? "border-red-500" : ""}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="biweekly">Biweekly</option>
                        <option value="weekly">Weekly</option>
                        <option value="custom">Custom</option>
                      </Select>
                      {errors.frequency && (
                        <p className="text-sm text-red-500 mt-1">{errors.frequency.message}</p>
                      )}
                    </div>

                    {(frequency === "monthly" || frequency === "biweekly") && (
                      <div>
                        <label htmlFor="generationDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Generation Day <span className="text-red-500">*</span>
                        </label>
                        <Input
                          id="generationDay"
                          type="number"
                          min={frequency === "monthly" ? 1 : 1}
                          max={frequency === "monthly" ? 31 : 14}
                          placeholder={frequency === "monthly" ? "1-31" : "1-14"}
                          {...register("generationDay", { valueAsNumber: true })}
                          className={errors.generationDay ? "border-red-500" : ""}
                        />
                        {errors.generationDay && (
                          <p className="text-sm text-red-500 mt-1">{errors.generationDay.message}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {frequency === "monthly"
                            ? "Day of the month (1-31)"
                            : "Day of the biweekly cycle (1-14)"}
                        </p>
                      </div>
                    )}

                    {frequency === "weekly" && (
                      <div>
                        <label htmlFor="generationDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Day of Week <span className="text-red-500">*</span>
                        </label>
                        <Select
                          id="generationDay"
                          {...register("generationDay", { valueAsNumber: true })}
                          className={errors.generationDay ? "border-red-500" : ""}
                        >
                          <option value={1}>Monday</option>
                          <option value={2}>Tuesday</option>
                          <option value={3}>Wednesday</option>
                          <option value={4}>Thursday</option>
                          <option value={5}>Friday</option>
                          <option value={6}>Saturday</option>
                          <option value={7}>Sunday</option>
                        </Select>
                        {errors.generationDay && (
                          <p className="text-sm text-red-500 mt-1">{errors.generationDay.message}</p>
                        )}
                      </div>
                    )}

                    <div>
                      <label htmlFor="generationTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Generation Time <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="generationTime"
                        type="time"
                        {...register("generationTime")}
                        className={errors.generationTime ? "border-red-500" : ""}
                      />
                      {errors.generationTime && (
                        <p className="text-sm text-red-500 mt-1">{errors.generationTime.message}</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Time in 24-hour format (HH:MM)
                      </p>
                    </div>

                    <div>
                      <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Timezone <span className="text-red-500">*</span>
                      </label>
                      <Select
                        id="timezone"
                        {...register("timezone")}
                        className={errors.timezone ? "border-red-500" : ""}
                      >
                        <option value="">Select timezone</option>
                        {timezones.map((tz) => (
                          <option key={tz} value={tz}>
                            {tz}
                          </option>
                        ))}
                      </Select>
                      {errors.timezone && (
                        <p className="text-sm text-red-500 mt-1">{errors.timezone.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="triggerType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Trigger Type <span className="text-red-500">*</span>
                      </label>
                      <Select
                        id="triggerType"
                        {...register("triggerType")}
                        className={errors.triggerType ? "border-red-500" : ""}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="manual">Manual</option>
                      </Select>
                      {errors.triggerType && (
                        <p className="text-sm text-red-500 mt-1">{errors.triggerType.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Automation Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              {renderSectionHeader("Automation Options", "automation")}
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("automation") && (
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register("autoApprove")}
                      className="w-4 h-4 rounded"
                      id="autoApprove"
                    />
                    <label htmlFor="autoApprove" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Auto Approve
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                      Automatically approve generated payslips
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register("autoSend")}
                      className="w-4 h-4 rounded"
                      id="autoSend"
                    />
                    <label htmlFor="autoSend" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Auto Send
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                      Automatically send payslips to employees
                    </p>
                  </div>
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Email Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              {renderSectionHeader("Email Configuration", "email")}
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("email") && (
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={emailConfig.sendToEmployees}
                      onChange={(e) =>
                        setEmailConfig((prev) => ({ ...prev, sendToEmployees: e.target.checked }))
                      }
                      className="w-4 h-4 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Send to Employees
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={emailConfig.sendToHR}
                      onChange={(e) =>
                        setEmailConfig((prev) => ({ ...prev, sendToHR: e.target.checked }))
                      }
                      className="w-4 h-4 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Send to HR
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CC Emails
                    </label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={newCcEmail}
                        onChange={(e) => setNewCcEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCcEmail())}
                      />
                      <Button type="button" onClick={addCcEmail} variant="outline">
                        Add
                      </Button>
                    </div>
                    {emailConfig.ccEmails.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {emailConfig.ccEmails.map((email) => (
                          <span
                            key={email}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-sm"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() => removeCcEmail(email)}
                              className="hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Notification Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              {renderSectionHeader("Notification Configuration", "notification")}
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("notification") && (
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={notificationConfig.sendNotifications}
                      onChange={(e) =>
                        setNotificationConfig((prev) => ({
                          ...prev,
                          sendNotifications: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Send Notifications
                    </label>
                  </div>

                  {notificationConfig.sendNotifications && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notification Channels
                      </label>
                      <div className="flex gap-4">
                        {["email", "sms", "push"].map((channel) => (
                          <label key={channel} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationConfig.notificationChannels.includes(channel)}
                              onChange={() => toggleNotificationChannel(channel)}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                              {channel}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Enabled Periods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              {renderSectionHeader("Enabled Periods", "periods")}
            </CardHeader>
            <AnimatePresence>
              {expandedSections.has("periods") && (
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Enabled Months
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {months.map((month) => (
                        <label
                          key={month.value}
                          className="flex items-center gap-2 cursor-pointer p-2 rounded border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <input
                            type="checkbox"
                            checked={enabledMonths.includes(month.value)}
                            onChange={() => toggleMonth(month.value)}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {month.label.substring(0, 3)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Enabled Years
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((year) => (
                        <label
                          key={year}
                          className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <input
                            type="checkbox"
                            checked={enabledYears.includes(year)}
                            onChange={() => toggleYear(year)}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{year}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Excluded Dates
                    </label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        type="date"
                        value={newExcludedDate}
                        onChange={(e) => setNewExcludedDate(e.target.value)}
                      />
                      <Button type="button" onClick={addExcludedDate} variant="outline">
                        Add
                      </Button>
                    </div>
                    {excludedDates.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {excludedDates.map((date) => (
                          <span
                            key={date}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded text-sm"
                          >
                            {new Date(date).toLocaleDateString()}
                            <button
                              type="button"
                              onClick={() => removeExcludedDate(date)}
                              className="hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-end gap-4"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/payroll/payslip-schedules")}
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
                Create Payslip Schedule
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}

