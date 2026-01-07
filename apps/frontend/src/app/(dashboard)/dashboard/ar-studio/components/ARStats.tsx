/**
 * Statistiques AR Studio
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Eye, Users, TrendingUp, Package } from 'lucide-react';

interface ARStatsProps {
  total: number;
  active: number;
  views: number;
  tryOns: number;
  conversions: number;
}

export function ARStats({
  total,
  active,
  views,
  tryOns,
  conversions,
}: ARStatsProps) {
  const conversionRate = tryOns > 0 ? ((conversions / tryOns) * 100).toFixed(1) : '0';

  const stats = [
    {
      label: 'Total Modèles',
      value: total,
      icon: Package,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Actifs',
      value: active,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Vues Total',
      value: views.toLocaleString('fr-FR'),
      icon: Eye,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Try-Ons',
      value: tryOns.toLocaleString('fr-FR'),
      icon: Users,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      label: 'Conversions',
      value: conversions.toLocaleString('fr-FR'),
      icon: TrendingUp,
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


