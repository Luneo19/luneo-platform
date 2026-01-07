'use client';

/**
 * Composant KPIs du Dashboard
 * Affiche les métriques principales avec indicateurs de changement
 */

'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc/client';

interface DashboardKPIsProps {
  period: '7d' | '30d' | '90d';
  onPeriodChange: (period: '7d' | '30d' | '90d') => void;
}

const KPI_CARDS = [
  {
    id: 'revenue',
    label: 'Revenus',
    icon: DollarSign,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  {
    id: 'orders',
    label: 'Commandes',
    icon: ShoppingCart,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  {
    id: 'avgOrder',
    label: 'Panier moyen',
    icon: Package,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
] as const;

function DashboardKPIsContent({
  period,
  onPeriodChange,
}: DashboardKPIsProps) {
  // Convert period to timeRange format
  const timeRange = period === '7d' ? '7d' : period === '30d' ? '30d' : '90d';

  // Fetch analytics data via tRPC
  const analyticsQuery = trpc.analytics.getDashboard.useQuery({
    timeRange,
    compare: true,
  });

  const analytics = analyticsQuery.data;
  const isLoading = analyticsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 w-24 bg-gray-700 rounded mb-2" />
                <div className="h-8 w-32 bg-gray-700 rounded mb-2" />
                <div className="h-4 w-40 bg-gray-700 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const revenue = analytics?.revenue ?? 0;
  const orders = analytics?.orders ?? 0;
  const avgOrderValue = analytics?.avgOrderValue ?? 0;
  const revenueChange = analytics?.revenueChange ?? 0;
  const ordersChange = analytics?.ordersChange ?? 0;

  const kpis = [
    {
      ...KPI_CARDS[0],
      value: formatPrice(revenue / 100, 'EUR'),
      change: revenueChange,
      changeLabel: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
    },
    {
      ...KPI_CARDS[1],
      value: orders.toString(),
      change: ordersChange,
      changeLabel: `${ordersChange >= 0 ? '+' : ''}${ordersChange.toFixed(1)}%`,
    },
    {
      ...KPI_CARDS[2],
      value: formatPrice(avgOrderValue / 100, 'EUR'),
      change: 0, // À calculer si nécessaire
      changeLabel: '—',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isPositive = kpi.change >= 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;

        return (
          <Card key={kpi.id} className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-1">{kpi.label}</p>
                  <p className="text-2xl font-bold text-white mb-2">
                    {kpi.value}
                  </p>
                  <div className="flex items-center gap-2">
                    <TrendIcon
                      className={cn(
                        'h-4 w-4',
                        isPositive ? 'text-green-400' : 'text-red-400'
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isPositive ? 'text-green-400' : 'text-red-400'
                      )}
                    >
                      {kpi.changeLabel}
                    </span>
                    <span className="text-xs text-gray-500">vs période précédente</span>
                  </div>
                </div>
                <div
                  className={cn(
                    'p-3 rounded-lg',
                    kpi.bgColor
                  )}
                >
                  <Icon className={cn('h-6 w-6', kpi.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export const DashboardKPIs = memo(DashboardKPIsContent);

