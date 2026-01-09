/**
 * Statistiques de la bibliothèque AR
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Library, Eye, Download, Heart, HardDrive } from 'lucide-react';
import { formatNumber, formatBytes } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import type { ARLibraryStats } from '../types';

interface ARLibraryStatsProps {
  stats: ARLibraryStats;
}

export function ARLibraryStats({ stats }: ARLibraryStatsProps) {
  const statItems = [
    {
      label: 'Total Modèles',
      value: formatNumber(stats.totalModels),
      icon: Library,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Taille Totale',
      value: formatBytes(stats.totalSize),
      icon: HardDrive,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Vues',
      value: formatNumber(stats.totalViews),
      icon: Eye,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Téléchargements',
      value: formatNumber(stats.totalDownloads),
      icon: Download,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Favoris',
      value: formatNumber(stats.totalFavorites),
      icon: Heart,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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



