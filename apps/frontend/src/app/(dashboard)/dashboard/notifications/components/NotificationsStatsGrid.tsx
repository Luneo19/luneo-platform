'use client';

import { Card } from '@/components/ui/card';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Bell, BellOff, CheckCircle, Archive, TrendingUp, Clock } from 'lucide-react';
import type { NotificationStats } from './types';

const STATS = [
  { label: 'Total', valueKey: 'total', icon: Bell, color: 'cyan' },
  { label: 'Non lues', valueKey: 'unread', icon: BellOff, color: 'red' },
  { label: 'Lues', valueKey: 'read', icon: CheckCircle, color: 'green' },
  { label: 'Archivées', valueKey: 'archived', icon: Archive, color: 'gray' },
  { label: 'Taux de lecture', valueKey: 'readRate', icon: TrendingUp, color: 'blue', format: (v: number) => `${Math.round(v)}%` },
  { label: 'Temps moyen', valueKey: 'avgReadTime', icon: Clock, color: 'purple', format: (v: number) => `${Math.round(v)}s` },
] as const;

interface NotificationsStatsGridProps {
  stats: NotificationStats;
}

export function NotificationsStatsGrid({ stats }: NotificationsStatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {STATS.map((stat, index) => {
        const Icon = stat.icon;
        const raw = Number(stats[stat.valueKey as keyof NotificationStats]);
        const value = 'format' in stat && typeof (stat as { format?: (v: number) => string }).format === 'function'
          ? (stat as { format: (v: number) => string }).format(raw)
          : raw;
        return (
          <motion
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 bg-zinc-800/50 border-zinc-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">{stat.label}</p>
                  <p className={`text-2xl font-bold text-${stat.color}-400 mt-1`}>{value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-500/10`}>
                  <Icon className={`w-5 h-5 text-${stat.color}-400`} />
                </div>
              </div>
            </Card>
          </motion>
        );
      })}
    </div>
  );
}
