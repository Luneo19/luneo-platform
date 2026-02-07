'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils/formatters';
import type { CreditStats } from './types';
import { Plus, Zap, RefreshCw, Gift, Sparkles, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';

interface CreditsStatsTabProps {
  stats: CreditStats;
}

const STAT_ITEMS = [
  { label: 'Achetés', valueKey: 'totalPurchased', icon: Plus, color: 'text-green-400', bg: 'bg-green-500/10' },
  { label: 'Utilisés', valueKey: 'totalUsed', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { label: 'Remboursés', valueKey: 'totalRefunded', icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { label: 'Bonus', valueKey: 'totalBonus', icon: Gift, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { label: 'Générations', valueKey: 'totalGenerations', icon: Sparkles, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { label: 'Coût moyen / génération', valueKey: 'avgCostPerGeneration', icon: DollarSign, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
] as const;

export function CreditsStatsTab({ stats }: CreditsStatsTabProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Statistiques d&apos;utilisation</CardTitle>
          <CardDescription className="text-gray-400">Vue détaillée de vos crédits et consommations</CardDescription>
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
                <Card key={item.label} className="p-4 bg-gray-900/50 border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{item.label}</p>
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
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Répartition et tendances
            </CardTitle>
            <CardDescription className="text-gray-400">Taux d&apos;utilisation et tendances récentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 p-3 bg-gray-900/50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <span className="text-gray-300">Taux d&apos;utilisation</span>
                <span className="font-bold text-cyan-400">{Math.round(stats.usageRate)}%</span>
              </div>
              {stats.byType && Object.entries(stats.byType).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2 p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400 capitalize">{type}</span>
                  <span className="font-bold text-white">{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
