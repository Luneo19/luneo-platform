/**
 * ★★★ ACTIVITY FEED ★★★
 * Feed d'activité en temps réel avec filtres et animations
 * Affiche les événements récents du système
 */

'use client';

import React, { useState } from 'react';
import { Activity, Filter, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  customerName?: string;
  customerEmail?: string;
  timestamp: Date | string;
  metadata?: Record<string, unknown>;
}

export interface ActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const activityIcons: Record<string, string> = {
  'user.created': '👤',
  'subscription.created': '💳',
  'subscription.cancelled': '❌',
  'payment.succeeded': '✅',
  'payment.failed': '⚠️',
  'trial.started': '🆓',
  'trial.converted': '🎉',
};

const activityColors: Record<string, string> = {
  'user.created': 'bg-blue-500/20 text-blue-400',
  'subscription.created': 'bg-green-500/20 text-green-400',
  'subscription.cancelled': 'bg-red-500/20 text-red-400',
  'payment.succeeded': 'bg-green-500/20 text-green-400',
  'payment.failed': 'bg-yellow-500/20 text-yellow-400',
  'trial.started': 'bg-purple-500/20 text-purple-400',
  'trial.converted': 'bg-emerald-500/20 text-emerald-400',
};

export function ActivityFeed({
  activities,
  isLoading = false,
  onRefresh,
  className,
}: ActivityFeedProps) {
  const [filter, setFilter] = useState<string>('all');

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(activity => activity.type === filter);

  const activityTypes = Array.from(new Set(activities.map(a => a.type)));

  if (isLoading) {
    return (
      <Card className={cn('bg-zinc-800 border-zinc-700', className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 bg-zinc-700 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-zinc-700 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-zinc-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-zinc-800 border-zinc-700', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        {activityTypes.length > 1 && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Filter className="w-4 h-4 text-zinc-400" />
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className="h-7 text-xs"
            >
              All
            </Button>
            {activityTypes.map((type) => (
              <Button
                key={type}
                variant={filter === type ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(type)}
                className="h-7 text-xs"
              >
                {type.split('.')[0]}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No activity yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {filteredActivities.map((activity) => (
              <ActivityItemComponent key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityItemComponent({ activity }: { activity: ActivityItem }) {
  const icon = activityIcons[activity.type] || '📋';
  const colorClass = activityColors[activity.type] || 'bg-zinc-500/20 text-zinc-400';
  const timestamp = typeof activity.timestamp === 'string'
    ? new Date(activity.timestamp)
    : activity.timestamp;

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-700/50 transition-colors group">
      <div className={cn(
        'h-8 w-8 rounded-full flex items-center justify-center text-sm flex-shrink-0',
        colorClass
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm text-white group-hover:text-white">
              {activity.message}
            </p>
            {activity.customerName && (
              <p className="text-xs text-zinc-400 mt-1">
                {activity.customerName}
                {activity.customerEmail && ` • ${activity.customerEmail}`}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            {formatRelativeTime(timestamp)}
          </Badge>
        </div>
      </div>
    </div>
  );
}
