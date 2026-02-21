'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/useI18n';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { CheckCheck, Trash2, Archive, ChevronRight, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeDate } from '@/lib/utils/formatters';
import { typeConfig, priorityConfig } from './constants';
import type { Notification } from './types';

interface NotificationCardProps {
  notification: Notification;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}

export function NotificationCard({
  notification,
  isSelected,
  onToggleSelect,
  onMarkAsRead,
  onDelete,
  index,
}: NotificationCardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const config = typeConfig[notification.type] ?? typeConfig.info;
  const Icon = config.icon;
  const priority = priorityConfig[notification.priority] ?? priorityConfig.normal;

  return (
    <motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card
        className={cn(
          'p-4 bg-zinc-800/50 border-zinc-700 transition-all',
          !notification.read && 'border-l-4 border-l-cyan-500',
          isSelected && 'border-2 border-cyan-500 bg-cyan-500/10',
        )}
      >
        <div className="flex gap-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(notification.id)}
              id={`notification-${notification.id}`}
            />
            <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={cn('font-medium', notification.read ? 'text-zinc-300' : 'text-white')}>
                    {notification.title}
                  </h3>
                  <Badge variant="outline" className={cn('text-xs', config.bg, config.color)}>
                    {t(config.labelKey)}
                  </Badge>
                  <Badge variant="outline" className={cn('text-xs', priority.bg, priority.color)}>
                    {t(priority.labelKey)}
                  </Badge>
                </div>
                <p className="text-sm text-zinc-400 mt-1">{notification.message}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                  <span>{formatRelativeDate(new Date(notification.created_at))}</span>
                  {notification.read_at && <span>{t('notifications.readAt')} {formatRelativeDate(new Date(notification.read_at))}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {notification.action_url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      onMarkAsRead(notification.id);
                      router.push(notification.action_url!);
                    }}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    {notification.action_label || t('common.view')}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
                {!notification.read && (
                  <Button size="sm" variant="ghost" onClick={() => onMarkAsRead(notification.id)} className="text-zinc-400 hover:text-white" title={t('common.markAsRead')}>
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => onDelete(notification.id)} className="text-zinc-400 hover:text-red-400" title={t('common.delete')}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                    <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)} className="text-white">
                      <CheckCheck className="w-4 h-4 mr-2" />
                      {t('common.markAsRead')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-white">
                      <Archive className="w-4 h-4 mr-2" />
                      {t('common.archive')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-700" />
                    <DropdownMenuItem onClick={() => onDelete(notification.id)} className="text-red-400">
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion>
  );
}
