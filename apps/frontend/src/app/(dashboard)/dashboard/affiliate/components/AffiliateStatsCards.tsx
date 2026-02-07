'use client';

import { Card } from '@/components/ui/card';
import { formatNumber, formatPrice } from '@/lib/utils/formatters';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Activity, DollarSign, Gift, Target, TrendingUp, Users } from 'lucide-react';
import type { AffiliateStats } from './types';

const STATS = [
  { label: 'Référents', key: 'totalReferrals' as const, icon: Users, color: 'blue', format: (v: number) => formatNumber(v) },
  { label: 'Actifs', key: 'activeReferrals' as const, icon: Activity, color: 'green', format: (v: number) => formatNumber(v) },
  { label: 'Conversions', key: 'totalConversions' as const, icon: Target, color: 'purple', format: (v: number) => formatNumber(v) },
  { label: 'Revenus', key: 'totalRevenue' as const, icon: DollarSign, color: 'green', format: (v: number) => formatPrice(v) },
  { label: 'Commissions', key: 'totalCommissions' as const, icon: Gift, color: 'yellow', format: (v: number) => formatPrice(v) },
  { label: 'Taux conversion', key: 'conversionRate' as const, icon: TrendingUp, color: 'cyan', format: (v: number) => `${v.toFixed(1)}%` },
];

interface AffiliateStatsCardsProps {
  stats: AffiliateStats;
}

export function AffiliateStatsCards({ stats }: AffiliateStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {STATS.map((stat, index) => {
        const Icon = stat.icon;
        const value = stats[stat.key];
        return (
          <motion
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 bg-gray-800/50 border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className={`text-2xl font-bold text-${stat.color}-400 mt-1`}>{stat.format(value)}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-500/10`}>
                  <Icon className={`w-5 h-5 text-${stat.color}-400`} />
                </div>
              </div>
            </Card>
          </motion>
        );
      })}
    </div>
  );
}
