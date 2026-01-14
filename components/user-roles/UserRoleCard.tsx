"use client";

import { useState } from "react";
import { User, UserRole } from "@/lib/types";

interface UserRoleCardProps {
  user: User;
  onAssignRole: (userId: string, role: UserRole) => void;
  canAssignSuperAdmin: boolean;
  loading: boolean;
}

const AVAILABLE_ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: "super_admin", label: "Super Admin", color: "bg-red-600" },
  { value: "provider_admin", label: "Provider Admin", color: "bg-orange-600" },
  { value: "provider_hr_staff", label: "Provider HR Staff", color: "bg-amber-600" },
  { value: "hrbp", label: "HRBP", color: "bg-yellow-600" },
  { value: "company_admin", label: "Company Admin", color: "bg-green-600" },
  { value: "department_head", label: "Department Head", color: "bg-teal-600" },
  { value: "manager", label: "Manager", color: "bg-blue-600" },
  { value: "employee", label: "Employee", color: "bg-slate-600" },
];

export default function UserRoleCard({ user, onAssignRole, canAssignSuperAdmin, loading }: UserRoleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);

  const currentRoleInfo = AVAILABLE_ROLES.find((r) => r.value === user.role);

  const handleRoleChange = () => {
    if (selectedRole !== user.role) {
      onAssignRole(user.id, selectedRole);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-all">
      {/* Card Header */}
      <div className="p-5 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{user.email}</h3>
                <p className="text-xs text-slate-500 font-mono">{user.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className={`px-3 py-1 ${currentRoleInfo?.color} text-white rounded-full text-xs font-semibold`}>
                {currentRoleInfo?.label}
              </span>
              {user.isEmailVerified && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <svg
              className={`w-5 h-5 text-slate-600 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-5 border-t border-slate-200 bg-slate-50">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Change Role</h4>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_ROLES.map((role) => {
                const isDisabled = role.value === "super_admin" && !canAssignSuperAdmin;
                return (
                  <button
                    key={role.value}
                    onClick={() => !isDisabled && setSelectedRole(role.value)}
                    disabled={isDisabled}
                    className={`p-2 rounded-lg text-xs font-medium transition-all ${
                      selectedRole === role.value
                        ? `${role.color} text-white shadow-md`
                        : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
                    } ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {role.label}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedRole !== user.role && (
            <button
              onClick={handleRoleChange}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
            >
              {loading ? "Updating..." : `Update to ${AVAILABLE_ROLES.find((r) => r.value === selectedRole)?.label}`}
            </button>
          )}

          {/* User Details */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Details</h4>
            <div className="space-y-1 text-xs text-slate-600">
              {user.phoneNumber && (
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span className="font-medium text-slate-800">{user.phoneNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Created:</span>
                <span className="font-medium text-slate-800">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Updated:</span>
                <span className="font-medium text-slate-800">
                  {new Date(user.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
