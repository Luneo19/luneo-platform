'use client';

/**
 * Statistiques des commandes
 * Client Component minimal
 */

import { Card } from '@/components/ui/card';
import {
  ShoppingCart,
  DollarSign,
  Clock,
  Truck,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import type { OrderStats } from '../types';

interface OrdersStatsProps {
  stats: OrderStats;
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(amount / 100);
}

export function OrdersStats({ stats }: OrdersStatsProps) {
  const { t } = useI18n();
  const statConfig = [
    {
      labelKey: 'orders.statsTotal' as const,
      value: (s: OrderStats) => s.total.toString(),
      icon: ShoppingCart,
      color: 'cyan',
    },
    {
      labelKey: 'orders.statsRevenue' as const,
      value: (s: OrderStats) => formatPrice(s.totalRevenue, 'EUR'),
      icon: DollarSign,
      color: 'green',
    },
    {
      labelKey: 'orders.statsPending' as const,
      value: (s: OrderStats) => s.pending.toString(),
      icon: Clock,
      color: 'yellow',
    },
    {
      labelKey: 'orders.statsShipped' as const,
      value: (s: OrderStats) => s.shipped.toString(),
      icon: Truck,
      color: 'blue',
    },
    {
      labelKey: 'orders.statsDelivered' as const,
      value: (s: OrderStats) => s.delivered.toString(),
      icon: CheckCircle2,
      color: 'green',
    },
    {
      labelKey: 'orders.statsAvgCart' as const,
      value: (s: OrderStats) => formatPrice(s.avgOrderValue, 'EUR'),
      icon: TrendingUp,
      color: 'purple',
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statConfig.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.labelKey} className="p-4 bg-white border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t(stat.labelKey)}</p>
                <p className={`text-2xl font-bold text-${stat.color}-400 mt-1`}>
                  {stat.value(stats)}
                </p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-500/10`}>
                <Icon className={`w-5 h-5 text-${stat.color}-400`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}






