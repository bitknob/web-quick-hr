"use client";

import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ApprovalFiltersProps {
  onFilterChange: (filters: { status?: string; requestType?: string }) => void;
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All Statuses" },
];

const typeOptions = [
  { value: "all", label: "All Types" },
  { value: "leave", label: "Leave" },
  { value: "employee_create", label: "New Employee" },
  { value: "salary_change", label: "Salary Change" },
];

export default function ApprovalFilters({ onFilterChange }: ApprovalFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Status</label>
        <select
          className="p-2 border rounded-md min-w-[150px] bg-white dark:bg-gray-800"
          onChange={(e) => onFilterChange({ status: e.target.value })}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Request Type</label>
        <select
          className="p-2 border rounded-md min-w-[150px] bg-white dark:bg-gray-800"
          onChange={(e) => onFilterChange({ requestType: e.target.value })}
        >
          {typeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
