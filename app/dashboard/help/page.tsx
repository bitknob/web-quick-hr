"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Users,
  FileCheck,
  Clock,
  Calendar,
  FileText,
  Building2,
  Shield,
  Settings,
  Search,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  BookOpen,
  Briefcase,
  DollarSign,
  UserCog,
  LayoutDashboard,
  Bell,
  Lock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";

interface HelpSection {
  id: string;
  title: string;
  icon: any;
  description: string;
  features: {
    title: string;
    description: string;
    steps?: string[];
  }[];
}

const helpSections: HelpSection[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    description: "Your central hub for monitoring HR activities and quick access to key metrics.",
    features: [
      {
        title: "Overview Statistics",
        description: "View real-time statistics including total employees, pending approvals, active requests, and growth rate.",
      },
      {
        title: "Recent Employees",
        description: "Quick view of the most recently added employees to your organization.",
      },
      {
        title: "Quick Actions",
        description: "Fast access to common tasks like creating new employees and viewing pending approvals.",
      },
    ],
  },
  {
    id: "employees",
    title: "Employee Management",
    icon: Users,
    description: "Comprehensive employee information management system.",
    features: [
      {
        title: "View All Employees",
        description: "Browse through all employees with filtering and search capabilities.",
        steps: [
          "Navigate to Employees from the sidebar",
          "Use the search bar to find specific employees",
          "Filter by department, status, or other criteria",
          "Click on any employee to view detailed information",
        ],
      },
      {
        title: "Add New Employee",
        description: "Create new employee records with complete information.",
        steps: [
          "Click 'Add Employee' button",
          "Fill in required information (name, email, job title, department)",
          "Add optional details (phone, salary, hire date, etc.)",
          "Click 'Save' to create the employee record",
        ],
      },
      {
        title: "Edit Employee Details",
        description: "Update existing employee information.",
        steps: [
          "Navigate to the employee's detail page",
          "Click 'Edit' or modify fields directly",
          "Update the necessary information",
          "Save changes to update the record",
        ],
      },
      {
        title: "Employee Profile",
        description: "View comprehensive employee information including personal details, job information, and user account status.",
      },
    ],
  },
  {
    id: "user-roles",
    title: "User Role Management",
    icon: Shield,
    description: "Manage user access levels and permissions across the system.",
    features: [
      {
        title: "Search Users",
        description: "Find users by their User ID or email address to manage their roles.",
        steps: [
          "Navigate to User Role Management",
          "Select search type (User ID or Email)",
          "Enter the search value",
          "Click 'Search User' to find the user",
        ],
      },
      {
        title: "Assign Roles",
        description: "Assign or change user roles to control system access.",
        steps: [
          "Search for the user",
          "Select the desired role from the available options",
          "Click 'Assign Role' to update permissions",
          "User will immediately have new access level",
        ],
      },
      {
        title: "Available Roles",
        description: "Different role levels with varying permissions:",
        steps: [
          "Super Admin - Full system access",
          "Provider Admin - Provider-level administration",
          "Provider HR Staff - Provider HR operations",
          "HRBP - HR Business Partner",
          "Company Admin - Company-level administration",
          "Department Head - Department management",
          "Manager - Team management",
          "Employee - Basic employee access",
        ],
      },
      {
        title: "Direct Access from Employee",
        description: "Quickly manage user roles directly from employee details page by clicking 'Manage User Role' button.",
      },
    ],
  },
  {
    id: "approvals",
    title: "Approvals",
    icon: FileCheck,
    description: "Review and process pending approval requests.",
    features: [
      {
        title: "View Pending Approvals",
        description: "See all requests awaiting your approval.",
      },
      {
        title: "Approve/Reject Requests",
        description: "Review request details and make approval decisions.",
        steps: [
          "Navigate to Approvals section",
          "Review request details",
          "Click 'Approve' or 'Reject'",
          "Add comments if necessary",
        ],
      },
      {
        title: "Approval History",
        description: "Track all approved and rejected requests with timestamps and comments.",
      },
    ],
  },
  {
    id: "attendance",
    title: "Attendance Management",
    icon: Clock,
    description: "Track and manage employee attendance and working hours.",
    features: [
      {
        title: "Clock In/Out",
        description: "Record employee attendance with precise timestamps.",
      },
      {
        title: "Attendance Reports",
        description: "Generate reports on employee attendance patterns and statistics.",
      },
      {
        title: "Time Tracking",
        description: "Monitor working hours and overtime for accurate payroll processing.",
      },
    ],
  },
  {
    id: "leave",
    title: "Leave Management",
    icon: Calendar,
    description: "Handle employee leave requests and track leave balances.",
    features: [
      {
        title: "Submit Leave Request",
        description: "Employees can request time off with specific dates and reasons.",
        steps: [
          "Navigate to Leave section",
          "Click 'Request Leave'",
          "Select leave type and dates",
          "Add reason/description",
          "Submit for approval",
        ],
      },
      {
        title: "Leave Balance",
        description: "View available leave days by type (annual, sick, personal, etc.).",
      },
      {
        title: "Leave History",
        description: "Track all past leave requests and their approval status.",
      },
      {
        title: "Approve Leave Requests",
        description: "Managers can review and approve/reject team member leave requests.",
      },
    ],
  },
  {
    id: "documents",
    title: "Document Management",
    icon: FileText,
    description: "Store and manage employee documents and company files.",
    features: [
      {
        title: "Upload Documents",
        description: "Add employee documents like contracts, certifications, and ID proofs.",
      },
      {
        title: "Document Categories",
        description: "Organize documents by type for easy retrieval.",
      },
      {
        title: "Access Control",
        description: "Control who can view or download specific documents.",
      },
      {
        title: "Version History",
        description: "Track document updates and maintain version history.",
      },
    ],
  },
  {
    id: "payroll",
    title: "Payroll Management",
    icon: DollarSign,
    description: "Process employee salaries and manage compensation.",
    features: [
      {
        title: "Salary Processing",
        description: "Calculate and process monthly salaries with deductions and bonuses.",
      },
      {
        title: "Payslip Generation",
        description: "Generate detailed payslips for employees.",
      },
      {
        title: "Tax Calculations",
        description: "Automatic tax deductions based on salary and regulations.",
      },
      {
        title: "Payment History",
        description: "Track all salary payments and generate reports.",
      },
    ],
  },
  {
    id: "companies",
    title: "Company Management",
    icon: Building2,
    description: "Manage multiple companies and their organizational structure.",
    features: [
      {
        title: "Company Profiles",
        description: "Create and manage company information and settings.",
      },
      {
        title: "Multi-Company Support",
        description: "Handle multiple companies within a single system.",
      },
      {
        title: "Company Hierarchy",
        description: "Define organizational structure and reporting relationships.",
      },
    ],
  },
  {
    id: "departments",
    title: "Department Management",
    icon: Briefcase,
    description: "Organize employees into departments and manage department information.",
    features: [
      {
        title: "Create Departments",
        description: "Set up departments with names, descriptions, and department heads.",
      },
      {
        title: "Department Assignment",
        description: "Assign employees to appropriate departments.",
      },
      {
        title: "Department Reports",
        description: "Generate department-wise analytics and reports.",
      },
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: Bell,
    description: "Stay updated with system notifications and alerts.",
    features: [
      {
        title: "Real-time Alerts",
        description: "Receive instant notifications for important events.",
      },
      {
        title: "Notification Types",
        description: "Get notified about approvals, leave requests, announcements, and more.",
      },
      {
        title: "Notification History",
        description: "View all past notifications and their status.",
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    description: "Configure system preferences and user settings.",
    features: [
      {
        title: "Profile Settings",
        description: "Update your personal information and preferences.",
      },
      {
        title: "System Configuration",
        description: "Configure system-wide settings (admin only).",
      },
      {
        title: "Security Settings",
        description: "Manage password, two-factor authentication, and security preferences.",
      },
      {
        title: "Notification Preferences",
        description: "Choose which notifications you want to receive.",
      },
    ],
  },
];

export default function HelpPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>(["dashboard"]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const filteredSections = helpSections.filter(
    (section) =>
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.features.some(
        (feature) =>
          feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          feature.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
            <HelpCircle className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          Help & Documentation
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Learn how to use QuickHR's features to manage your HR operations efficiently
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-2 border-gray-200 dark:border-gray-800">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for features, guides, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Help Sections */}
      <div className="space-y-4">
        {filteredSections.length > 0 ? (
          filteredSections.map((section, index) => {
            const Icon = section.icon;
            const isExpanded = expandedSections.includes(section.id);

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <Card className="border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <CardHeader
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl mb-1">{section.title}</CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {section.description}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-6 w-6 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0 pb-6">
                      <div className="space-y-6">
                        {section.features.map((feature, featureIndex) => (
                          <motion.div
                            key={featureIndex}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: featureIndex * 0.05 }}
                            className="pl-16"
                          >
                            <div className="border-l-4 border-blue-600 dark:border-blue-500 pl-4 py-2">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                {feature.title}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400 mb-3">
                                {feature.description}
                              </p>
                              {feature.steps && feature.steps.length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mt-3">
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Steps:
                                  </p>
                                  <ol className="space-y-2">
                                    {feature.steps.map((step, stepIndex) => (
                                      <li
                                        key={stepIndex}
                                        className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400"
                                      >
                                        <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600 dark:bg-blue-700 text-white flex items-center justify-center text-xs font-bold">
                                          {stepIndex + 1}
                                        </span>
                                        <span className="pt-0.5">{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            );
          })
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No results found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try searching with different keywords
            </p>
          </motion.div>
        )}
      </div>

      {/* Detailed Roles & Permissions (Super Admin Only) */}
      {user?.role === "super_admin" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-md">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Role Permissions Matrix</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Super Admin Only - Detailed permissions for each role
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Super Admin */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-purple-300 dark:border-purple-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Super Admin</h3>
                    <span className="ml-auto px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">FULL ACCESS</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Complete system access with all permissions. Can manage all users, roles, companies, and system settings.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "Assign all roles including Super Admin",
                      "Manage all companies and providers",
                      "Full employee management",
                      "System configuration access",
                      "View all reports and analytics",
                      "Manage departments and hierarchy",
                      "Full payroll access",
                      "Document management (all)",
                    ].map((perm, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Provider Admin */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-300 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Provider Admin</h3>
                    <span className="ml-auto px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">PROVIDER LEVEL</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Provider-level administration with access to all companies under their provider.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { text: "Assign roles (except Super Admin)", allowed: true },
                      { text: "Manage provider companies", allowed: true },
                      { text: "Full employee management (provider)", allowed: true },
                      { text: "Provider reports and analytics", allowed: true },
                      { text: "Manage departments (provider)", allowed: true },
                      { text: "Payroll access (provider)", allowed: true },
                      { text: "System configuration", allowed: false },
                      { text: "Cross-provider access", allowed: false },
                    ].map((perm, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {perm.allowed ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                        )}
                        <span className={perm.allowed ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-500"}>
                          {perm.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Provider HR Staff */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-300 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <UserCog className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Provider HR Staff</h3>
                    <span className="ml-auto px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">HR OPERATIONS</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    HR operations staff with access to employee management and HR processes.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { text: "View and manage employees", allowed: true },
                      { text: "Process leave requests", allowed: true },
                      { text: "Manage attendance", allowed: true },
                      { text: "View reports", allowed: true },
                      { text: "Document management", allowed: true },
                      { text: "Assign roles", allowed: false },
                      { text: "Payroll processing", allowed: false },
                      { text: "Company settings", allowed: false },
                    ].map((perm, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {perm.allowed ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                        )}
                        <span className={perm.allowed ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-500"}>
                          {perm.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* HRBP */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-300 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Briefcase className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">HRBP (HR Business Partner)</h3>
                    <span className="ml-auto px-3 py-1 bg-teal-600 text-white text-xs font-semibold rounded-full">STRATEGIC HR</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Strategic HR partner with access to analytics and employee relations.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { text: "View employee data", allowed: true },
                      { text: "HR analytics and reports", allowed: true },
                      { text: "Performance management", allowed: true },
                      { text: "Employee relations", allowed: true },
                      { text: "Approve leave requests", allowed: true },
                      { text: "Payroll access", allowed: false },
                      { text: "System configuration", allowed: false },
                      { text: "Role management", allowed: false },
                    ].map((perm, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {perm.allowed ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                        )}
                        <span className={perm.allowed ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-500"}>
                          {perm.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Company Admin */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-300 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Company Admin</h3>
                    <span className="ml-auto px-3 py-1 bg-orange-600 text-white text-xs font-semibold rounded-full">COMPANY LEVEL</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Company-level administration with full access to their company's data.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { text: "Manage company employees", allowed: true },
                      { text: "Company settings", allowed: true },
                      { text: "Department management", allowed: true },
                      { text: "Company reports", allowed: true },
                      { text: "Payroll (company)", allowed: true },
                      { text: "Cross-company access", allowed: false },
                      { text: "Provider settings", allowed: false },
                      { text: "Assign Super Admin", allowed: false },
                    ].map((perm, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {perm.allowed ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                        )}
                        <span className={perm.allowed ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-500"}>
                          {perm.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Department Head */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-300 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Department Head</h3>
                    <span className="ml-auto px-3 py-1 bg-cyan-600 text-white text-xs font-semibold rounded-full">DEPARTMENT</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Department-level management with access to department employees and operations.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { text: "View department employees", allowed: true },
                      { text: "Approve department leave", allowed: true },
                      { text: "Department reports", allowed: true },
                      { text: "Performance reviews", allowed: true },
                      { text: "Manage other departments", allowed: false },
                      { text: "Payroll access", allowed: false },
                      { text: "Company settings", allowed: false },
                      { text: "Role assignment", allowed: false },
                    ].map((perm, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {perm.allowed ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                        )}
                        <span className={perm.allowed ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-500"}>
                          {perm.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Manager */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-300 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <UserCog className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Manager</h3>
                    <span className="ml-auto px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">TEAM LEAD</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Team management with access to direct reports and team operations.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { text: "View team members", allowed: true },
                      { text: "Approve team leave", allowed: true },
                      { text: "Team attendance", allowed: true },
                      { text: "Performance reviews (team)", allowed: true },
                      { text: "Department-wide access", allowed: false },
                      { text: "Payroll access", allowed: false },
                      { text: "Employee management", allowed: false },
                      { text: "System settings", allowed: false },
                    ].map((perm, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {perm.allowed ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                        )}
                        <span className={perm.allowed ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-500"}>
                          {perm.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Employee */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-300 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Employee</h3>
                    <span className="ml-auto px-3 py-1 bg-gray-600 text-white text-xs font-semibold rounded-full">BASIC ACCESS</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Basic employee access with self-service capabilities.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { text: "View own profile", allowed: true },
                      { text: "Request leave", allowed: true },
                      { text: "View own attendance", allowed: true },
                      { text: "View own documents", allowed: true },
                      { text: "View own payslips", allowed: true },
                      { text: "View other employees", allowed: false },
                      { text: "Approve requests", allowed: false },
                      { text: "Access reports", allowed: false },
                    ].map((perm, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {perm.allowed ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                        )}
                        <span className={perm.allowed ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-500"}>
                          {perm.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Additional Help */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Need More Help?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  If you can't find what you're looking for or need additional assistance,
                  please contact your system administrator or HR support team.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>System Version: 1.0.0</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>Last Updated: January 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
