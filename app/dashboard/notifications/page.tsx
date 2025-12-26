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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslations } from "@/lib/hooks/use-translations";
import { formatDateTime, getErrorMessage } from "@/lib/utils";
import { useCallback } from "react";

export default function NotificationsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const t = useTranslations();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await notificationsApi.getNotifications();
      setNotifications(response.response);
    } catch (error: unknown) {
      addToast({
        title: t.toast.error,
        description: getErrorMessage(error),
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast, t.toast.error]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      addToast({
        title: t.toast.success,
        description: t.notifications.notificationMarkedAsRead,
        variant: "success",
      });
      fetchNotifications();
    } catch (error: unknown) {
      addToast({
        title: t.toast.error,
        description: getErrorMessage(error),
        variant: "error",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      addToast({
        title: t.toast.success,
        description: t.notifications.allNotificationsMarkedAsRead,
        variant: "success",
      });
      fetchNotifications();
    } catch (error: unknown) {
      addToast({
        title: t.toast.error,
        description: getErrorMessage(error),
        variant: "error",
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    setNotificationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!notificationToDelete) return;

    try {
      await notificationsApi.deleteNotification(notificationToDelete);
      addToast({
        title: t.toast.success,
        description: t.notifications.notificationDeleted,
        variant: "success",
      });
      fetchNotifications();
      setDeleteDialogOpen(false);
      setNotificationToDelete(null);
    } catch (error: unknown) {
      addToast({
        title: t.toast.error,
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t.notifications.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} ${unreadCount > 1 ? t.notifications.unreadNotifications : t.notifications.unreadNotification}` : t.notifications.allCaughtUp}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            {t.notifications.markAllAsRead}
          </Button>
        )}
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>{t.notifications.allNotifications}</CardTitle>
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
                        onClick={() => handleDeleteClick(notification.id)}
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
              title={t.notifications.noNotifications}
              description={t.notifications.allCaughtUpDescription}
            />
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title={t.dialog.deleteNotification.title}
        message={t.dialog.deleteNotification.message}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setNotificationToDelete(null);
        }}
      />
    </div>
  );
}

