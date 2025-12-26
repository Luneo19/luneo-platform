/**
 * ★★★ COMPOSANT - CENTRE DE NOTIFICATIONS ★★★
 * Composant complet pour le centre de notifications
 * - Liste notifications
 * - Marquer comme lu
 * - Actions
 * - Préférences
 */

'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/lib/trpc/client';
import { formatRelativeDate } from '@/lib/utils/formatters';
import { Bell, Check, CheckCheck, ExternalLink, Settings, X } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

// ========================================
// COMPONENT
// ========================================

function NotificationCenterContent() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Queries
  const notificationsQuery = trpc.notification.list.useQuery(
    { limit: 50 },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Mutations
  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      notificationsQuery.refetch();
    },
  });

  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      notificationsQuery.refetch();
    },
  });

  const deleteMutation = trpc.notification.delete.useMutation({
    onSuccess: () => {
      notificationsQuery.refetch();
    },
  });

  // ========================================
  // UNREAD COUNT
  // ========================================

  const unreadCount = useMemo(() => {
    return notificationsQuery.data?.unreadCount || 0;
  }, [notificationsQuery.data]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleMarkAsRead = useCallback(
    (notificationId: string) => {
      markAsReadMutation.mutate({ id: notificationId });
    },
    [markAsReadMutation]
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const handleDelete = useCallback(
    (notificationId: string) => {
      deleteMutation.mutate({ id: notificationId });
    },
    [deleteMutation]
  );

  const handleAction = useCallback((actionUrl?: string) => {
    if (actionUrl) {
      window.location.href = actionUrl;
    }
  }, []);

  // ========================================
  // RENDER
  // ========================================

  const notifications = notificationsQuery.data?.notifications || [];

  return (
    <>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(true)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lue${unreadCount > 1 ? 's' : ''})` : ''}`}
        data-testid="notification-center-button"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Center Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Notifications</DialogTitle>
                <DialogDescription>
                  {unreadCount > 0
                    ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                    : 'Toutes vos notifications'}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Tout marquer comme lu
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreferences(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">Aucune notification</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        handleMarkAsRead(notification.id);
                      }
                      if (notification.actionUrl) {
                        handleAction(notification.actionUrl);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{formatRelativeDate(notification.createdAt)}</span>
                            {notification.actionUrl && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <ExternalLink className="h-3 w-3" />
                                {notification.actionLabel || 'Voir'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ========================================
// EXPORT
// ========================================

const NotificationCenterComponent = memo(function NotificationCenter() {
  return (
    <ErrorBoundary>
      <NotificationCenterContent />
    </ErrorBoundary>
  );
});

// Named export for direct imports
export const NotificationCenter = NotificationCenterComponent;

// Default export
export default NotificationCenter;
