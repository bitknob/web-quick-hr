"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileCheck, Clock, TrendingUp } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuthStore } from "@/lib/store/auth-store";
import { employeesApi } from "@/lib/api/employees";
import { approvalsApi } from "@/lib/api/approvals";
import { Employee } from "@/lib/types";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingApprovals: 0,
    recentEmployees: [] as Employee[],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeesRes, approvalsRes] = await Promise.allSettled([
          employeesApi.searchEmployees({ limit: 5 }),
          approvalsApi.getPendingApprovals(),
        ]);

        let totalEmployees = 0;
        let pendingApprovals = 0;
        let recentEmployees: Employee[] = [];

        if (employeesRes.status === "fulfilled") {
          totalEmployees = employeesRes.value.response.length;
          recentEmployees = employeesRes.value.response.slice(0, 5);
        }

        if (approvalsRes.status === "fulfilled") {
          pendingApprovals = approvalsRes.value.response.length;
        }

        setStats({
          totalEmployees,
          pendingApprovals,
          recentEmployees,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: Users,
      color: "bg-blue-600",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: FileCheck,
      color: "bg-purple-600",
    },
    {
      title: "Active Requests",
      value: 0,
      icon: Clock,
      color: "bg-green-600",
    },
    {
      title: "Growth Rate",
      value: "12%",
      icon: TrendingUp,
      color: "bg-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Here&apos;s what&apos;s happening with your HR system today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                    </div>
                    <div className={`h-14 w-14 rounded-xl ${stat.color} flex items-center justify-center shadow-sm`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Employees</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="md" className="mx-auto mb-2" />
                  <p className="text-gray-500">Loading...</p>
                </div>
              ) : stats.recentEmployees.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentEmployees.map((employee, index) => (
                    <motion.div
                      key={employee.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{employee.jobTitle}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        {employee.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No employees found"
                  description="Get started by creating a new employee"
                  action={{
                    label: "Add Employee",
                    onClick: () => router.push("/dashboard/employees/create"),
                  }}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/dashboard/employees/create">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer"
                  >
                    <p className="font-medium text-gray-900 dark:text-gray-100">Create New Employee</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add a new employee to the system</p>
                  </motion.div>
                </Link>
                <Link href="/dashboard/approvals">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer"
                  >
                    <p className="font-medium text-gray-900 dark:text-gray-100">View Pending Approvals</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and approve pending requests</p>
                  </motion.div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

