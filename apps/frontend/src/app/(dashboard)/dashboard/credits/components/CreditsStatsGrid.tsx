'use client';

import { Card } from '@/components/ui/card';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Plus, Zap, RefreshCw, Gift, Sparkles, DollarSign } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import type { CreditStats } from './types';
import { formatNumber } from '@/lib/utils/formatters';

const STAT_KEYS = [
  { labelKey: 'credits.stats.purchased', valueKey: 'totalPurchased', icon: Plus, color: 'green' },
  { labelKey: 'credits.stats.used', valueKey: 'totalUsed', icon: Zap, color: 'red' },
  { labelKey: 'credits.stats.refunded', valueKey: 'totalRefunded', icon: RefreshCw, color: 'blue' },
  { labelKey: 'credits.stats.bonus', valueKey: 'totalBonus', icon: Gift, color: 'purple' },
  { labelKey: 'credits.stats.generations', valueKey: 'totalGenerations', icon: Sparkles, color: 'cyan' },
  { labelKey: 'credits.stats.avgCost', valueKey: 'avgCostPerGeneration', icon: DollarSign, color: 'yellow' },
] as const;

interface CreditsStatsGridProps {
  stats: CreditStats;
}

export function CreditsStatsGrid({ stats }: CreditsStatsGridProps) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {STAT_KEYS.map((stat, index) => {
        const Icon = stat.icon;
        const value =
          stat.valueKey === 'avgCostPerGeneration'
            ? `${Math.round(stats[stat.valueKey])}`
            : formatNumber(Number(stats[stat.valueKey]));
        return (
          <motion
            key={stat.labelKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 bg-gray-50 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t(stat.labelKey)}</p>
                  <p className={`text-2xl font-bold text-${stat.color}-400 mt-1`}>{value}</p>
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
