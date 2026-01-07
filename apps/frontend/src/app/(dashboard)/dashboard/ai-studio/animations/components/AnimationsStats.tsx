/**
 * Statistiques des animations
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Video, Sparkles, Clock, TrendingUp, Heart, Film } from 'lucide-react';
import { formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';

interface AnimationsStatsProps {
  totalGenerations: number;
  totalCredits: number;
  avgGenerationTime: number;
  successRate: number;
  favoriteCount: number;
  totalDuration: number;
}

export function AnimationsStats({
  totalGenerations,
  totalCredits,
  avgGenerationTime,
  successRate,
  favoriteCount,
  totalDuration,
}: AnimationsStatsProps) {
  const statItems = [
    {
      label: 'Total Générations',
      value: formatNumber(totalGenerations),
      icon: Video,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Crédits Utilisés',
      value: formatNumber(totalCredits),
      icon: Sparkles,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Temps Moyen',
      value: `${avgGenerationTime.toFixed(1)}s`,
      icon: Clock,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Taux de Succès',
      value: `${successRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Favoris',
      value: formatNumber(favoriteCount),
      icon: Heart,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
    },
    {
      label: 'Durée Totale',
      value: `${totalDuration.toFixed(1)}s`,
      icon: Film,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
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


