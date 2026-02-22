/**
 * Statistiques des intégrations AR
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Plug, CheckCircle2, Activity, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntegrationsStatsProps {
  total: number;
  connected: number;
  enabled: number;
  totalSyncs: number;
  averageSuccessRate: number;
  totalErrors: number;
}

export function IntegrationsStats({
  total,
  connected,
  enabled,
  totalSyncs,
  averageSuccessRate,
  totalErrors,
}: IntegrationsStatsProps) {
  const stats = [
    {
      label: 'Total',
      value: total,
      icon: Plug,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Connectées',
      value: connected,
      icon: CheckCircle2,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Activées',
      value: enabled,
      icon: Activity,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      label: 'Synchronisations',
      value: totalSyncs.toLocaleString('fr-FR'),
      icon: RefreshCw,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Taux de succès',
      value: `${averageSuccessRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Erreurs',
      value: totalErrors,
      icon: AlertCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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



