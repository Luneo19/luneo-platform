'use client';

import { Card } from '@/components/ui/card';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Plus, Zap, RefreshCw, Gift, Sparkles, DollarSign } from 'lucide-react';
import type { CreditStats } from './types';
import { formatNumber } from '@/lib/utils/formatters';

const STATS = [
  { label: 'Achetés', valueKey: 'totalPurchased', icon: Plus, color: 'green' },
  { label: 'Utilisés', valueKey: 'totalUsed', icon: Zap, color: 'red' },
  { label: 'Remboursés', valueKey: 'totalRefunded', icon: RefreshCw, color: 'blue' },
  { label: 'Bonus', valueKey: 'totalBonus', icon: Gift, color: 'purple' },
  { label: 'Générations', valueKey: 'totalGenerations', icon: Sparkles, color: 'cyan' },
  { label: 'Coût moyen', valueKey: 'avgCostPerGeneration', icon: DollarSign, color: 'yellow' },
] as const;

interface CreditsStatsGridProps {
  stats: CreditStats;
}

export function CreditsStatsGrid({ stats }: CreditsStatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {STATS.map((stat, index) => {
        const Icon = stat.icon;
        const value =
          stat.valueKey === 'avgCostPerGeneration'
            ? `${Math.round(stats[stat.valueKey])}`
            : formatNumber(Number(stats[stat.valueKey]));
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
