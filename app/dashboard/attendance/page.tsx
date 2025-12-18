"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Calendar } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";

export default function AttendancePage() {
  const [isLoading] = useState(false);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Attendance</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage attendance records</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable />
          ) : (
            <EmptyState
              icon={Clock}
              title="No attendance records"
              description="Attendance tracking will be available here"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

