'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n/useI18n';
import { formatNumber } from '@/lib/utils/formatters';
import type { CreditStats } from './types';
import { Plus, Zap, RefreshCw, Gift, Sparkles, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';

interface CreditsStatsTabProps {
  stats: CreditStats;
}

const STAT_ITEMS = [
  { labelKey: 'credits.stats.purchased', valueKey: 'totalPurchased', icon: Plus, color: 'text-green-400', bg: 'bg-green-500/10' },
  { labelKey: 'credits.stats.used', valueKey: 'totalUsed', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { labelKey: 'credits.stats.refunded', valueKey: 'totalRefunded', icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { labelKey: 'credits.stats.bonus', valueKey: 'totalBonus', icon: Gift, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { labelKey: 'credits.stats.generations', valueKey: 'totalGenerations', icon: Sparkles, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { labelKey: 'credits.stats.avgCostPerGeneration', valueKey: 'avgCostPerGeneration', icon: DollarSign, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
] as const;

export function CreditsStatsTab({ stats }: CreditsStatsTabProps) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">{t('credits.stats.usageStats')}</CardTitle>
          <CardDescription className="text-gray-600">{t('credits.stats.usageStatsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {STAT_ITEMS.map((item) => {
              const Icon = item.icon;
              const value =
                item.valueKey === 'avgCostPerGeneration'
                  ? `${Math.round(stats[item.valueKey])}`
                  : formatNumber(Number(stats[item.valueKey]));
              return (
                <Card key={item.labelKey} className="p-4 bg-gray-50 border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{t(item.labelKey)}</p>
                      <p className={`text-2xl font-bold mt-1 ${item.color}`}>{value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${item.bg}`}>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {(stats.trends?.length > 0 || Object.keys(stats.byType ?? {}).length > 0) && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t('credits.stats.distributionTrends')}
            </CardTitle>
            <CardDescription className="text-gray-600">{t('credits.stats.usageRateTrends')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-cyan-600" />
                <span className="text-gray-700">{t('credits.stats.usageRate')}</span>
                <span className="font-bold text-cyan-600">{Math.round(stats.usageRate)}%</span>
              </div>
              {stats.byType && Object.entries(stats.byType).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 capitalize">{type}</span>
                  <span className="font-bold text-gray-900">{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
