"use client";

import { useState } from "react";
import Image from "next/image";
import { Bell, User, Settings, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dropdown, DropdownItem, DropdownDivider, DropdownHeader } from "@/components/ui/dropdown";
import { useAuthStore } from "@/lib/store/auth-store";
import { Notification } from "@/lib/types";
import { GlobalSearch } from "./global-search";

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [notifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex-1"></div>
        
        <div className="flex-1 flex justify-center max-w-md">
          <GlobalSearch />
        </div>

        <div className="flex-1 flex items-center justify-end gap-4">
          <Dropdown
            trigger={
              <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            }
            align="right"
            contentClassName="w-80"
          >
            <DropdownHeader>NOTIFICATIONS</DropdownHeader>
            <DropdownDivider />
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownItem
                    key={notification.id}
                    onClick={() => {
                      if (notification.link) {
                        router.push(notification.link);
                      }
                    }}
                    className={!notification.read ? "bg-blue-50 dark:bg-blue-900/10" : ""}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      )}
                    </div>
                  </DropdownItem>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No notifications
                </div>
              )}
            </div>
            <DropdownDivider />
            <DropdownItem
              onClick={() => router.push("/dashboard/notifications")}
              className="text-center text-blue-600 dark:text-blue-400 font-medium"
            >
              View all notifications
            </DropdownItem>
          </Dropdown>

          <Dropdown
            trigger={
              user?.profileImageUrl ? (
                <div className="relative h-10 w-10 rounded-full border-2 border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform cursor-pointer overflow-hidden">
                  <Image
                    src={user.profileImageUrl}
                    alt={user.email || "User"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-semibold hover:scale-105 transition-transform cursor-pointer">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
              )
            }
            align="right"
          >
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user?.email || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                {user?.role?.replace(/_/g, " ") || "Employee"}
              </p>
            </div>
            <DropdownItem onClick={() => router.push("/dashboard/profile")}>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </div>
            </DropdownItem>
            <DropdownItem onClick={() => router.push("/dashboard/settings")}>
              <div className="flex items-center gap-3">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </div>
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem onClick={handleLogout} danger>
              <div className="flex items-center gap-3">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </div>
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}

