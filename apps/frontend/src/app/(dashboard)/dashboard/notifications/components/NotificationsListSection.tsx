'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Bell, Loader2, CheckCheck, Trash2 } from 'lucide-react';
import { NotificationCard } from './NotificationCard';
import type { Notification } from './types';

interface NotificationsListSectionProps {
  loading: boolean;
  filteredNotifications: Notification[];
  groupedNotifications: Record<string, Notification[]>;
  groupByDate: boolean;
  selectedNotifications: Set<string>;
  searchTerm: string;
  filterType: string;
  filterPriority: string;
  filterStatus: string;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onBulkMarkRead: () => void;
  onBulkDelete: () => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationsListSection({
  loading,
  filteredNotifications,
  groupedNotifications,
  groupByDate,
  selectedNotifications,
  searchTerm,
  filterType,
  filterPriority,
  filterStatus,
  onToggleSelect,
  onSelectAll,
  onBulkMarkRead,
  onBulkDelete,
  onMarkAsRead,
  onDelete,
}: NotificationsListSectionProps) {
  const hasFilters = searchTerm || filterType !== 'all' || filterPriority !== 'all' || filterStatus !== 'all';

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (filteredNotifications.length === 0) {
    return (
      <Card className="p-12 bg-zinc-800/50 border-zinc-700 text-center">
        <Bell className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Aucune notification</h3>
        <p className="text-zinc-400">
          {hasFilters ? 'Aucune notification ne correspond à vos filtres' : 'Vous êtes à jour !'}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-zinc-800/50 border-zinc-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
              onCheckedChange={onSelectAll}
              id="select-all"
            />
            <Label htmlFor="select-all" className="text-zinc-300 cursor-pointer">
              {selectedNotifications.size > 0 ? `${selectedNotifications.size} sélectionnée(s)` : 'Sélectionner tout'}
            </Label>
          </div>
          {selectedNotifications.size > 0 && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={onBulkMarkRead} className="border-zinc-600">
                <CheckCheck className="w-4 h-4 mr-2" />
                Marquer lu
              </Button>
              <Button size="sm" variant="outline" onClick={onBulkDelete} className="border-gray-600 text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-6">
        {Object.entries(groupedNotifications).map(([groupKey, groupNotifications]) => (
          <div key={groupKey} className="space-y-3">
            {groupByDate && (
              <div className="flex items-center gap-2 mb-4">
                <Separator className="flex-1 bg-zinc-700" />
                <span className="text-sm font-medium text-zinc-400 px-3">{groupKey}</span>
                <Separator className="flex-1 bg-zinc-700" />
              </div>
            )}
            {groupNotifications.map((notification, index) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                isSelected={selectedNotifications.has(notification.id)}
                onToggleSelect={onToggleSelect}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                index={index}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
