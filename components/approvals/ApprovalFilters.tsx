"use client";

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
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex flex-col gap-1.5 min-w-[150px]">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
        <select
          className="p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onChange={(e) => onFilterChange({ status: e.target.value })}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5 min-w-[150px]">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Request Type</label>
        <select
          className="p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
