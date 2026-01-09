/**
 * Statistiques AI Studio
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Loader2, XCircle, Zap, TrendingUp } from 'lucide-react';

interface AIStatsProps {
  total: number;
  completed: number;
  processing: number;
  failed: number;
  totalCredits: number;
}

export function AIStats({
  total,
  completed,
  processing,
  failed,
  totalCredits,
}: AIStatsProps) {
  const stats = [
    {
      label: 'Total',
      value: total,
      icon: TrendingUp,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Réussies',
      value: completed,
      icon: CheckCircle2,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'En cours',
      value: processing,
      icon: Loader2,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Échouées',
      value: failed,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      label: 'Crédits utilisés',
      value: totalCredits.toLocaleString('fr-FR'),
      icon: Zap,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Taux de succès',
      value: total > 0 ? `${((completed / total) * 100).toFixed(1)}%` : '0%',
      icon: TrendingUp,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className={`${stat.bgColor} border-gray-700`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}



