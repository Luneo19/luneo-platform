/**
 * Statistiques AB Testing
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FlaskConical, Play, CheckCircle2, TrendingUp, Users, Target } from 'lucide-react';
import { formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';

interface ABTestingStatsProps {
  total: number;
  running: number;
  completed: number;
  totalVisitors: number;
  totalConversions: number;
  avgConfidence: number;
  avgUplift: number;
}

export function ABTestingStats({
  total,
  running,
  completed,
  totalVisitors,
  totalConversions,
  avgConfidence,
  avgUplift,
}: ABTestingStatsProps) {
  const conversionRate =
    totalVisitors > 0 ? ((totalConversions / totalVisitors) * 100).toFixed(2) : '0';

  const stats = [
    {
      label: 'Total Tests',
      value: total,
      icon: FlaskConical,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'En cours',
      value: running,
      icon: Play,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Terminés',
      value: completed,
      icon: CheckCircle2,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Visiteurs',
      value: formatNumber(totalVisitors),
      icon: Users,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      label: 'Conversions',
      value: formatNumber(totalConversions),
      icon: Target,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Taux Conversion',
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
    },
    {
      label: 'Confiance Moy.',
      value: `${avgConfidence.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Uplift Moy.',
      value: `${avgUplift.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {stats.map((stat) => {
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



