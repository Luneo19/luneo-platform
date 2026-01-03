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

const statConfig = [
  {
    label: 'Total',
    value: (stats: OrderStats) => stats.total.toString(),
    icon: ShoppingCart,
    color: 'cyan',
  },
  {
    label: 'Revenus',
    value: (stats: OrderStats) => formatPrice(stats.totalRevenue, 'EUR'),
    icon: DollarSign,
    color: 'green',
  },
  {
    label: 'En attente',
    value: (stats: OrderStats) => stats.pending.toString(),
    icon: Clock,
    color: 'yellow',
  },
  {
    label: 'Expédiées',
    value: (stats: OrderStats) => stats.shipped.toString(),
    icon: Truck,
    color: 'blue',
  },
  {
    label: 'Livrées',
    value: (stats: OrderStats) => stats.delivered.toString(),
    icon: CheckCircle2,
    color: 'green',
  },
  {
    label: 'Panier moyen',
    value: (stats: OrderStats) => formatPrice(stats.avgOrderValue, 'EUR'),
    icon: TrendingUp,
    color: 'purple',
  },
] as const;

export function OrdersStats({ stats }: OrdersStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statConfig.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
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

