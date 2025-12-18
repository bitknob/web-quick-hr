"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { notificationsApi } from "@/lib/api/notifications";
import { Notification } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { formatDateTime, getErrorMessage } from "@/lib/utils";
import { useCallback } from "react";

export default function NotificationsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await notificationsApi.getNotifications();
      setNotifications(response.response);
    } catch (error: unknown) {
      addToast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      addToast({
        title: "Success",
        description: "Notification marked as read",
        variant: "success",
      });
      fetchNotifications();
    } catch (error: unknown) {
      addToast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "error",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      addToast({
        title: "Success",
        description: "All notifications marked as read",
        variant: "success",
      });
      fetchNotifications();
    } catch (error: unknown) {
      addToast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "error",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;

    try {
      await notificationsApi.deleteNotification(id);
      addToast({
        title: "Success",
        description: "Notification deleted successfully",
        variant: "success",
      });
      fetchNotifications();
    } catch (error: unknown) {
      addToast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "error",
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable />
          ) : notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    notification.read
                      ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      : "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        {!notification.read && (
                          <div className="h-2 w-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {formatDateTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-gray-600 dark:text-gray-400"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="You're all caught up! No new notifications."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

