/**
 * Statistiques de prévisualisation AR
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Eye, Smartphone, Clock, TrendingUp, CheckCircle2, Monitor } from 'lucide-react';
import { formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import type { ARPreviewStats } from '../types';

interface ARPreviewStatsProps {
  stats: ARPreviewStats;
}

export function ARPreviewStats({ stats }: ARPreviewStatsProps) {
  const statItems = [
    {
      label: 'Total Modèles',
      value: formatNumber(stats.totalModels),
      icon: Eye,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Vues',
      value: formatNumber(stats.totalViews),
      icon: Eye,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Sessions',
      value: formatNumber(stats.totalSessions),
      icon: Smartphone,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Durée Moy.',
      value: `${stats.avgSessionDuration}s`,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Prêts',
      value: formatNumber(stats.readyModels),
      icon: CheckCircle2,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      label: 'iOS',
      value: formatNumber(stats.byPlatform.ios),
      icon: Monitor,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className={cn('border-gray-700', stat.bgColor)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={cn('w-5 h-5', stat.color)} />
              </div>
              <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
              <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


