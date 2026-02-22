'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, CheckCheck, Trash2, Settings, Download, MoreVertical } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';

interface NotificationsHeaderProps {
  unreadCount: number;
  selectedCount: number;
  onBulkMarkRead: () => void;
  onBulkDelete: () => void;
  onMarkAllAsRead: () => void;
  onOpenPreferences: () => void;
  onOpenExport: () => void;
}

export function NotificationsHeader({
  unreadCount,
  selectedCount,
  onBulkMarkRead,
  onBulkDelete,
  onMarkAllAsRead,
  onOpenPreferences,
  onOpenExport,
}: NotificationsHeaderProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Bell className="w-8 h-8 text-cyan-400" />
          {t('notifications.title')}
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {t('notifications.unreadCountLabel', { count: unreadCount })}
            </Badge>
          )}
        </h1>
        <p className="text-zinc-400 mt-1">{t('notifications.manageSubtitle')}</p>
      </div>
      <div className="flex gap-2">
        {selectedCount > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-zinc-600">
                <MoreVertical className="w-4 h-4 mr-2" />
                {t('notifications.actionsWithCount', { count: selectedCount })}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
              <DropdownMenuItem onClick={onBulkMarkRead} className="text-white">
                <CheckCheck className="w-4 h-4 mr-2" />
                {t('common.markAsRead')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onBulkDelete} className="text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {unreadCount > 0 && (
          <Button onClick={onMarkAllAsRead} variant="outline" className="border-zinc-600">
            <CheckCheck className="w-4 h-4 mr-2" />
            {t('notifications.markAllRead')}
          </Button>
        )}
        <Button onClick={onOpenPreferences} variant="outline" className="border-zinc-600">
          <Settings className="w-4 h-4 mr-2" />
          {t('notifications.preferences')}
        </Button>
        <Button onClick={onOpenExport} variant="outline" className="border-zinc-600">
          <Download className="w-4 h-4 mr-2" />
          {t('common.export')}
        </Button>
      </div>
    </div>
  );
}
