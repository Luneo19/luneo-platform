/**
 * Statistiques Seller Dashboard
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  DollarSign,
  Package,
  TrendingUp,
  Wallet,
  ShoppingCart,
  Star,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/formatters';

// Helper to format price (assuming prices are in cents)
function formatPriceFromCents(value: number): string {
  return formatPrice(value / 100, 'EUR');
}
import { cn } from '@/lib/utils';
import type { SellerStats as SellerStatsType } from '../types';

interface SellerStatsProps {
  stats: SellerStatsType | null;
}

export function SellerStats({ stats }: SellerStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="h-16 bg-gray-700 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      label: 'Revenus totaux',
      value: formatPriceFromCents(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      trend: stats.revenueGrowth > 0 ? 'up' : 'down',
      trendValue: `${Math.abs(stats.revenueGrowth)}%`,
    },
    {
      label: 'Ventes',
      value: stats.totalSales.toLocaleString('fr-FR'),
      icon: ShoppingCart,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Balance disponible',
      value: formatPriceFromCents(stats.availableBalance),
      icon: Wallet,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Paiement en attente',
      value: formatPriceFromCents(stats.pendingPayout),
      icon: TrendingUp,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Produits actifs',
      value: stats.activeProducts.toLocaleString('fr-FR'),
      icon: Package,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      label: 'Note moyenne',
      value: stats.averageRating.toFixed(1),
      icon: Star,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      subtitle: `${stats.totalReviews} avis`,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statsCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className={cn('border-gray-700', stat.bgColor)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={cn('w-5 h-5', stat.color)} />
                {stat.trend && (
                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs',
                      stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                    )}
                  >
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {stat.trendValue}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
              <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

