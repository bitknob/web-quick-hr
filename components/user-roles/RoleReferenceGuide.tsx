"use client";

import { useState } from "react";
import { UserRole } from "@/lib/types";

interface RoleInfo {
  role: UserRole;
  label: string;
  description: string;
  permissions: string[];
  color: string;
}

const ROLE_INFORMATION: RoleInfo[] = [
  {
    role: "super_admin",
    label: "Super Admin",
    description: "Full system access with all privileges",
    permissions: [
      "Full system administration",
      "Manage all providers and companies",
      "Assign any role including super_admin",
      "Access all modules and features",
      "System configuration and settings",
    ],
    color: "from-red-500 to-pink-600",
  },
  {
    role: "provider_admin",
    label: "Provider Admin",
    description: "Provider-level administration and management",
    permissions: [
      "Manage provider-level settings",
      "Create and manage companies",
      "Assign roles (except super_admin)",
      "Manage provider HR staff",
      "Access provider analytics",
    ],
    color: "from-orange-500 to-red-600",
  },
  {
    role: "provider_hr_staff",
    label: "Provider HR Staff",
    description: "Provider HR operations and support",
    permissions: [
      "View all companies under provider",
      "Manage employee records",
      "Process HR operations",
      "Generate reports",
      "Support HR activities",
    ],
    color: "from-amber-500 to-orange-600",
  },
  {
    role: "hrbp",
    label: "HR Business Partner",
    description: "Strategic HR partnership and support",
    permissions: [
      "Strategic HR planning",
      "Employee relations",
      "Talent management",
      "Performance management",
      "HR policy implementation",
    ],
    color: "from-yellow-500 to-amber-600",
  },
  {
    role: "company_admin",
    label: "Company Admin",
    description: "Company-level administration",
    permissions: [
      "Manage company settings",
      "Create departments",
      "Manage employees",
      "Configure payroll",
      "Access company reports",
    ],
    color: "from-green-500 to-emerald-600",
  },
  {
    role: "department_head",
    label: "Department Head",
    description: "Department management and oversight",
    permissions: [
      "Manage department employees",
      "Approve leave requests",
      "View department reports",
      "Manage team performance",
      "Department budget oversight",
    ],
    color: "from-teal-500 to-cyan-600",
  },
  {
    role: "manager",
    label: "Manager",
    description: "Team management and supervision",
    permissions: [
      "Manage team members",
      "Approve team leave requests",
      "View team attendance",
      "Conduct performance reviews",
      "Manage team tasks",
    ],
    color: "from-blue-500 to-indigo-600",
  },
  {
    role: "employee",
    label: "Employee",
    description: "Basic employee access and self-service",
    permissions: [
      "View own profile",
      "Submit leave requests",
      "Mark attendance",
      "View payslips",
      "Update personal information",
    ],
    color: "from-slate-500 to-gray-600",
  },
];

export default function RoleReferenceGuide() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const selectedRoleInfo = ROLE_INFORMATION.find((r) => r.role === selectedRole);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Role Reference Guide
        </h2>
        <p className="text-slate-600 text-sm">
          Click on any role to view detailed permissions and capabilities
        </p>
      </div>

      {/* Role Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {ROLE_INFORMATION.map((roleInfo) => (
          <button
            key={roleInfo.role}
            onClick={() => setSelectedRole(selectedRole === roleInfo.role ? null : roleInfo.role)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              selectedRole === roleInfo.role
                ? "border-indigo-500 bg-indigo-50 shadow-lg scale-105"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${roleInfo.color} flex items-center justify-center`}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">{roleInfo.label}</h3>
                <p className="text-xs text-slate-500">{roleInfo.role}</p>
              </div>
              {selectedRole === roleInfo.role && (
                <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-sm text-slate-600">{roleInfo.description}</p>
          </button>
        ))}
      </div>

      {/* Selected Role Details */}
      {selectedRoleInfo && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedRoleInfo.color} flex items-center justify-center shadow-lg`}>
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">{selectedRoleInfo.label}</h3>
              <p className="text-sm text-slate-600">{selectedRoleInfo.description}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Key Permissions & Capabilities
            </h4>
            <ul className="space-y-2">
              {selectedRoleInfo.permissions.map((permission, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{permission}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Quick Tips
        </h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Roles are hierarchical - higher roles have more permissions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Always assign the minimum role needed for the job</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Role changes take effect immediately across the system</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
