/**
 * Sélecteur de métriques pour Analytics
 */

'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { METRIC_TYPES } from '../constants/analytics';

interface MetricSelectorProps {
  selectedMetrics: Set<string>;
  onToggleMetric: (metricId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function MetricSelector({
  selectedMetrics,
  onToggleMetric,
  onSelectAll,
  onDeselectAll,
}: MetricSelectorProps) {
  return (
    <Card className="p-4 bg-gray-800/50 border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <Label className="text-gray-300">Métriques à afficher</Label>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onSelectAll}>
            Tout sélectionner
          </Button>
          <Button variant="ghost" size="sm" onClick={onDeselectAll}>
            Tout désélectionner
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {METRIC_TYPES.map((metric) => {
          const Icon = metric.icon as React.ComponentType<{ className?: string }>;
          return (
            <button
              key={metric.value}
              onClick={() => onToggleMetric(metric.value)}
              className={cn(
                'p-3 rounded-lg border-2 transition-all text-left',
                selectedMetrics.has(metric.value)
                  ? metric.color === 'green' ? 'border-green-500 bg-green-500/10' :
                    metric.color === 'blue' ? 'border-blue-500 bg-blue-500/10' :
                    metric.color === 'purple' ? 'border-purple-500 bg-purple-500/10' :
                    metric.color === 'orange' ? 'border-orange-500 bg-orange-500/10' :
                    'border-pink-500 bg-pink-500/10'
                  : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
              )}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={cn(
                    'w-5 h-5',
                    selectedMetrics.has(metric.value)
                      ? (metric.color === 'green' ? 'text-green-400' :
                         metric.color === 'blue' ? 'text-blue-400' :
                         metric.color === 'purple' ? 'text-purple-400' :
                         metric.color === 'orange' ? 'text-orange-400' :
                         'text-pink-400')
                      : 'text-gray-500'
                  )}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    selectedMetrics.has(metric.value) ? 'text-white' : 'text-gray-400'
                  )}
                >
                  {String(metric.label)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

