/**
 * Statistiques AI Studio
 */

'use client';

import { useI18n } from '@/i18n/useI18n';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Loader2, XCircle, Zap, TrendingUp } from 'lucide-react';

interface AIStatsProps {
  total: number;
  completed: number;
  processing: number;
  failed: number;
  totalCredits: number;
}

export function AIStats({
  total,
  completed,
  processing,
  failed,
  totalCredits,
}: AIStatsProps) {
  const { t } = useI18n();
  const stats = [
    {
      label: t('aiStudio.stats.total'),
      value: total,
      icon: TrendingUp,
      color: 'text-[#3b82f6]',
      bgColor: 'bg-[#3b82f6]/10',
    },
    {
      label: t('aiStudio.stats.completed'),
      value: completed,
      icon: CheckCircle2,
      color: 'text-[#4ade80]',
      bgColor: 'bg-[#4ade80]/10',
    },
    {
      label: t('aiStudio.stats.processing'),
      value: processing,
      icon: Loader2,
      color: 'text-[#fbbf24]',
      bgColor: 'bg-[#fbbf24]/10',
    },
    {
      label: t('aiStudio.stats.failed'),
      value: failed,
      icon: XCircle,
      color: 'text-[#f87171]',
      bgColor: 'bg-[#f87171]/10',
    },
    {
      label: t('aiStudio.stats.creditsUsed'),
      value: totalCredits.toLocaleString('fr-FR'),
      icon: Zap,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: t('aiStudio.stats.successRate'),
      value: total > 0 ? `${((completed / total) * 100).toFixed(1)}%` : '0%',
      icon: TrendingUp,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className={`dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm ${stat.bgColor}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-xs text-white/40 mb-1">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
