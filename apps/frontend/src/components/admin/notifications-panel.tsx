/**
 * ★★★ NOTIFICATIONS PANEL ★★★
 * Panneau de notifications pour le Super Admin Dashboard
 * Affiche les notifications système, alertes, et activités récentes
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Check,
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { logger } from '@/lib/logger';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationsPanelProps {
  userId?: string;
}

export function NotificationsPanel({ userId }: NotificationsPanelProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchNotifications();
    }
  }, [open, userId]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/notifications', { credentials: 'include' });
      if (!res.ok) {
        setNotifications([]);
        return;
      }
      const raw = await res.json();
      const data = raw?.data ?? raw;
      const list = (data as { notifications?: unknown[] })?.notifications ?? [];
      const items = Array.isArray(list) ? list : [];
      setNotifications(
        (items as Record<string, unknown>[]).map((n) => ({
          id: String(n.id ?? ''),
          type: (n.type as Notification['type']) ?? 'info',
          title: String(n.title ?? ''),
          message: String(n.message ?? n.body ?? ''),
          read: Boolean((n as Record<string, unknown>).is_read ?? n.read),
          createdAt: n.createdAt ? new Date(n.createdAt as string) : (n.created_at ? new Date(n.created_at as string) : new Date()),
          actionUrl: n.actionUrl ? String(n.actionUrl) : (n as Record<string, unknown>).action_url ? String((n as Record<string, unknown>).action_url) : undefined,
          actionLabel: n.actionLabel ? String(n.actionLabel) : (n as Record<string, unknown>).action_label ? String((n as Record<string, unknown>).action_label) : undefined,
        }))
      );
    } catch (error) {
      logger.error('Failed to fetch notifications', error as Error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/notifications/${id}/read`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
      }
    } catch (error) {
      logger.error('Failed to mark notification as read', error as Error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/v1/notifications/read-all', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (error) {
      logger.error('Failed to mark all notifications as read', error as Error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (error) {
      logger.error('Failed to delete notification', error as Error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          onClick={() => setOpen(!open)}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0 bg-zinc-900 border-zinc-800"
        align="end"
      >
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Mark all as read
            </Button>
          )}
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              No notifications
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-zinc-800/50 transition-colors',
                    !notification.read && 'bg-zinc-800/30',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium text-white text-sm">
                            {notification.title}
                          </div>
                          <div className="text-sm text-zinc-400 mt-1">
                            {notification.message}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(notification.createdAt, {
                                addSuffix: true,
                              })}
                            </span>
                            {notification.actionUrl && (
                              <a
                                href={notification.actionUrl}
                                className="text-xs text-blue-500 hover:text-blue-400"
                                onClick={() => setOpen(false)}
                              >
                                {notification.actionLabel || 'View'}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-zinc-500 hover:text-white rounded"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-zinc-500 hover:text-red-500 rounded"
                            title="Delete"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-4 border-t border-zinc-800">
            <a
              href="/admin/notifications"
              className="text-sm text-blue-500 hover:text-blue-400 text-center block"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </a>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
