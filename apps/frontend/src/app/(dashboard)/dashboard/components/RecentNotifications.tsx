'use client';

/**
 * Composant Notifications Récentes
 * Affiche les 5 dernières notifications
 */

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import Link from 'next/link';
import { formatRelativeDate } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';

interface RecentNotificationsProps {
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
  }>;
}

const NOTIFICATION_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  default: Bell,
} as const;

const NOTIFICATION_COLORS = {
  success: 'text-green-400 bg-green-500/20',
  error: 'text-red-400 bg-red-500/20',
  warning: 'text-yellow-400 bg-yellow-500/20',
  info: 'text-blue-400 bg-blue-500/20',
  default: 'text-gray-400 bg-gray-500/20',
} as const;

function RecentNotificationsContent({ notifications }: RecentNotificationsProps) {
  const displayNotifications = notifications.slice(0, 5);

  if (displayNotifications.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Aucune notification récente</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications récentes
          </CardTitle>
          <Link href="/notifications">
            <Button variant="ghost" size="sm" className="text-xs">
              Voir tout
            </Button>
          </Link>
        </div>
        <CardDescription>Dernières notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayNotifications.map((notification) => {
          const Icon =
            NOTIFICATION_ICONS[
              (notification.type as keyof typeof NOTIFICATION_ICONS) || 'default'
            ] || NOTIFICATION_ICONS.default;
          const colorClass =
            NOTIFICATION_COLORS[
              (notification.type as keyof typeof NOTIFICATION_COLORS) || 'default'
            ] || NOTIFICATION_COLORS.default;

          return (
            <div
              key={notification.id}
              className={cn(
                'p-3 rounded-lg border transition-colors',
                notification.read
                  ? 'bg-gray-900/50 border-gray-700'
                  : 'bg-blue-500/10 border-blue-500/30'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('p-2 rounded-lg', colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatRelativeDate(new Date(notification.created_at))}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export const RecentNotifications = memo(RecentNotificationsContent);


