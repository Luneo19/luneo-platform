'use client';

import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import {
  TicketIcon,
  AlertCircle,
  Clock,
  CheckCircle,
  Timer,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatItem {
  label: string;
  value: number;
  color: 'cyan' | 'blue' | 'yellow' | 'green' | 'orange' | 'red';
  icon: React.ComponentType<{ className?: string }>;
}

interface SupportStatsCardsProps {
  ticketsLength: number;
  stats: { total?: number; open?: number; pending?: number; closed?: number } | null;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  pendingCount: number;
  urgentCount: number;
}

export function SupportStatsCards({
  ticketsLength,
  stats,
  openCount,
  inProgressCount,
  resolvedCount,
  pendingCount,
  urgentCount,
}: SupportStatsCardsProps) {
  const items: StatItem[] = [
    { label: 'Total', value: stats?.total ?? ticketsLength, color: 'cyan', icon: TicketIcon },
    { label: 'Ouverts', value: stats?.open ?? openCount, color: 'blue', icon: AlertCircle },
    { label: 'En cours', value: stats?.pending ?? inProgressCount, color: 'yellow', icon: Clock },
    { label: 'Résolus', value: stats?.closed ?? resolvedCount, color: 'green', icon: CheckCircle },
    { label: 'En attente', value: pendingCount, color: 'orange', icon: Timer },
    { label: 'Urgents', value: urgentCount, color: 'red', icon: AlertTriangle },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {items.map((stat) => {
        const Icon = stat.icon;
        return (
          <motion key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="dash-card p-4 border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">{stat.label}</p>
                  <p
                    className={cn(
                      'text-2xl font-bold',
                      stat.color === 'cyan' && 'text-cyan-400',
                      stat.color === 'blue' && 'text-blue-400',
                      stat.color === 'yellow' && 'text-yellow-400',
                      stat.color === 'green' && 'text-green-400',
                      stat.color === 'orange' && 'text-orange-400',
                      stat.color === 'red' && 'text-red-400'
                    )}
                  >
                    {stat.value}
                  </p>
                </div>
                <div
                  className={cn(
                    'p-3 rounded-lg',
                    stat.color === 'cyan' && 'bg-cyan-500/10',
                    stat.color === 'blue' && 'bg-blue-500/10',
                    stat.color === 'yellow' && 'bg-yellow-500/10',
                    stat.color === 'green' && 'bg-green-500/10',
                    stat.color === 'orange' && 'bg-orange-500/10',
                    stat.color === 'red' && 'bg-red-500/10'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      stat.color === 'cyan' && 'text-cyan-400',
                      stat.color === 'blue' && 'text-blue-400',
                      stat.color === 'yellow' && 'text-yellow-400',
                      stat.color === 'green' && 'text-green-400',
                      stat.color === 'orange' && 'text-orange-400',
                      stat.color === 'red' && 'text-red-400'
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
