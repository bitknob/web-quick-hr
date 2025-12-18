"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:pl-0 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

