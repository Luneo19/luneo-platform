'use client';

/**
 * NotificationBell Component - SaaS World-Class
 *
 * Features:
 * - Data from NestJS backend /api/v1/notifications (cookie-based auth)
 * - Optimistic UI updates
 * - Keyboard navigation
 * - Accessibility (WCAG AA)
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { Bell, Check, X, Loader2, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { endpoints } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { logger } from '../../lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'order' | 'payment' | 'design' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  is_archived: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  resource_type?: string;
  resource_id?: string;
  action_url?: string;
  action_label?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

interface NotificationBellProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const typeIcons = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  order: Bell,
  payment: CheckCircle,
  design: Bell,
  system: Info,
};

const typeColors = {
  success: 'text-green-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
  order: 'text-purple-500',
  payment: 'text-green-500',
  design: 'text-blue-500',
  system: 'text-gray-500',
};

function NotificationBellComponent({ className, variant = 'ghost', size = 'md' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await endpoints.notifications.list({ limit: 50, unreadOnly: false });
      const list = data?.notifications ?? [];
      const listArr = Array.isArray(list) ? (list as Notification[]) : [];
      setNotifications(listArr);
      setUnreadCount(listArr.filter(n => !n.is_read).length);
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Optimistic update
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      await endpoints.notifications.markAsRead(notificationId);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      toast.error('Erreur lors de la mise à jour');
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      setIsMarkingAllRead(true);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);

      await endpoints.notifications.markAllAsRead();
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      logger.error('Error marking all as read:', error);
      toast.error('Erreur lors de la mise à jour');
      fetchNotifications();
    } finally {
      setIsMarkingAllRead(false);
    }
  }, [fetchNotifications]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      const wasUnread = notification?.is_read === false;
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      await endpoints.notifications.delete(notificationId);
      toast.success('Notification supprimée');
    } catch (error) {
      logger.error('Error deleting notification:', error);
      toast.error('Erreur lors de la suppression');
      fetchNotifications();
    }
  }, [notifications, fetchNotifications]);

  // Handle notification click
  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    if (notification.action_url) {
      router.push(notification.action_url);
      setIsOpen(false);
    }
  }, [markAsRead, router]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        variant={variant}
        size={size === 'md' ? 'sm' : size}
        onClick={() => setIsOpen(!isOpen)}
        className={cn('relative', sizeClasses[size])}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion
            as="div"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/20"
            />

            {/* Dropdown */}
            <motion
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full z-50 mt-2 w-96 rounded-lg border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl"
              role="dialog"
              aria-label="Notifications"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
                <h3 className="font-semibold text-white">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      disabled={isMarkingAllRead}
                      className="text-xs"
                    >
                      {isMarkingAllRead ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Tout marquer comme lu'
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 p-0"
                    aria-label="Fermer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <ScrollArea className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Bell className="h-12 w-12 text-white/40 mb-4" />
                    <p className="text-sm text-white/60">Aucune notification</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.06]">
                    {notifications.map((notification) => {
                      const Icon = typeIcons[notification.type];
                      const iconColor = typeColors[notification.type];

                      return (
                        <motion
                          key={notification.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            'relative p-4 transition-colors hover:bg-white/[0.04]',
                            !notification.is_read && 'bg-white/[0.03]'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn('mt-0.5', iconColor)}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p
                                    className={cn(
                                      'text-sm font-medium',
                                      !notification.is_read && 'font-semibold'
                                    )}
                                  >
                                    {notification.title}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(notification.created_at), {
                                        addSuffix: true,
                                        locale: fr,
                                      })}
                                    </span>
                                    {notification.priority === 'urgent' && (
                                      <Badge variant="destructive" className="text-xs">
                                        Urgent
                                      </Badge>
                                    )}
                                    {notification.priority === 'high' && (
                                      <Badge variant="outline" className="text-xs">
                                        Important
                                      </Badge>
                                    )}
                                  </div>
                                  {notification.action_url && notification.action_label && (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="mt-2 h-auto p-0 text-xs"
                                      onClick={() => handleNotificationClick(notification)}
                                    >
                                      {notification.action_label} →
                                    </Button>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  {!notification.is_read && (
                                    <button
                                      onClick={() => markAsRead(notification.id)}
                                      className="rounded p-1 hover:bg-muted"
                                      aria-label="Marquer comme lu"
                                    >
                                      <Check className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteNotification(notification.id)}
                                    className="rounded p-1 hover:bg-muted"
                                    aria-label="Supprimer"
                                  >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          {!notification.is_read && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
                          )}
                        </motion>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="border-t border-border p-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => router.push('/dashboard/notifications')}
                  >
                    Voir toutes les notifications
                  </Button>
                </div>
              )}
            </motion>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const NotificationBellMemo = memo(NotificationBellComponent);

export function NotificationBellWrapper(props: NotificationBellProps) {
  return (
    <ErrorBoundary componentName="NotificationBell">
      <NotificationBellMemo {...props} />
    </ErrorBoundary>
  );
}

export const NotificationBell = NotificationBellWrapper;
export default NotificationBellWrapper;

