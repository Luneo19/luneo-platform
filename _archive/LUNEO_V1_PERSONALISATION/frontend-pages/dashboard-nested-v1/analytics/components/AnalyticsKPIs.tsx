/**
 * Composant KPIs pour Analytics
 */

'use client';

import { Card } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { cn } from '@/lib/utils';
import { formatPrice, formatNumber, formatPercentage } from '@/lib/utils/formatters';
import { useI18n } from '@/i18n/useI18n';
import type { AnalyticsMetric } from '../types';

interface AnalyticsKPIsProps {
  metrics: AnalyticsMetric[];
  selectedMetrics: Set<string>;
}

export function AnalyticsKPIs({ metrics, selectedMetrics }: AnalyticsKPIsProps) {
  const { t } = useI18n();
  const visibleMetrics = metrics.filter((m) => selectedMetrics.has(m.id));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {visibleMetrics.map((metric, index) => {
        const Icon = metric.icon as React.ComponentType<{ className?: string }>;
        const ChangeIcon =
          metric.changeType === 'increase'
            ? ArrowUp
            : metric.changeType === 'decrease'
            ? ArrowDown
            : Minus;

        return (
          <motion
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 bg-white border-gray-200 hover:border-cyan-500/50 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className={cn(
                  'p-2 rounded-lg',
                  metric.color === 'green' && 'bg-green-500/10',
                  metric.color === 'blue' && 'bg-blue-500/10',
                  metric.color === 'purple' && 'bg-purple-500/10',
                  metric.color === 'orange' && 'bg-orange-500/10',
                  metric.color === 'pink' && 'bg-pink-500/10',
                )}>
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      metric.color === 'green' && 'text-green-400',
                      metric.color === 'blue' && 'text-blue-400',
                      metric.color === 'purple' && 'text-purple-400',
                      metric.color === 'orange' && 'text-orange-400',
                      metric.color === 'pink' && 'text-pink-400',
                    )}
                  />
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    metric.changeType === 'increase' && 'text-green-400',
                    metric.changeType === 'decrease' && 'text-red-400',
                    metric.changeType === 'neutral' && 'text-gray-400'
                  )}
                >
                  <ChangeIcon className="w-3 h-3" />
                  <span>{Math.abs(metric.change).toFixed(1)}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t(`analytics.metrics.${metric.id}` as 'analytics.metrics.revenue')}</p>
                <p className={cn(
                  'text-2xl font-bold',
                  metric.color === 'green' && 'text-green-400',
                  metric.color === 'blue' && 'text-blue-400',
                  metric.color === 'purple' && 'text-purple-400',
                  metric.color === 'orange' && 'text-orange-400',
                  metric.color === 'pink' && 'text-pink-400',
                )}>
                  {metric.format === 'currency'
                    ? formatPrice(metric.value, 'EUR')
                    : metric.format === 'percentage'
                    ? formatPercentage(metric.value)
                    : formatNumber(metric.value)}
                </p>
                {metric.description && (
                  <p className="text-xs text-gray-600 mt-1">{metric.description}</p>
                )}
              </div>
            </Card>
          </motion>
        );
      })}
    </div>
  );
}

