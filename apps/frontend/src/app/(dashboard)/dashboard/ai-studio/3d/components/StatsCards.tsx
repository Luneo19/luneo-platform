'use client';

import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { AIStudioStats } from './types';
import { STAT_CARDS } from './constants';

interface StatsCardsProps {
  stats: AIStudioStats;
}

function getDisplayValue(key: string, stats: AIStudioStats): string | number {
  const v = stats[key as keyof AIStudioStats];
  if (typeof v === 'number') {
    if (key === 'avgGenerationTime') return `${v}s`;
    if (key === 'successRate') return `${v}%`;
    if (key === 'avgPolyCount') return v.toLocaleString();
    return v;
  }
  return String(v ?? '');
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {STAT_CARDS.map((stat) => {
        const Icon = stat.icon;
        const value = getDisplayValue(stat.key, stats);
        return (
          <motion
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p
                    className={cn(
                      'text-xl font-bold',
                      stat.color === 'cyan' && 'text-cyan-400',
                      stat.color === 'blue' && 'text-blue-400',
                      stat.color === 'green' && 'text-green-400',
                      stat.color === 'purple' && 'text-purple-400',
                      stat.color === 'pink' && 'text-pink-400',
                      stat.color === 'orange' && 'text-orange-400'
                    )}
                  >
                    {value}
                  </p>
                </div>
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    stat.color === 'cyan' && 'bg-cyan-500/10',
                    stat.color === 'blue' && 'bg-blue-500/10',
                    stat.color === 'green' && 'bg-green-500/10',
                    stat.color === 'purple' && 'bg-purple-500/10',
                    stat.color === 'pink' && 'bg-pink-500/10',
                    stat.color === 'orange' && 'bg-orange-500/10'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4',
                      stat.color === 'cyan' && 'text-cyan-400',
                      stat.color === 'blue' && 'text-blue-400',
                      stat.color === 'green' && 'text-green-400',
                      stat.color === 'purple' && 'text-purple-400',
                      stat.color === 'pink' && 'text-pink-400',
                      stat.color === 'orange' && 'text-orange-400'
                    )}
                  />
                </div>
              </div>
            </Card>
          </motion>
        );
      })}
    </div>
  );
}
