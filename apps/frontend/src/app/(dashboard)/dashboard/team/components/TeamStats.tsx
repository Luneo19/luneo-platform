/**
 * Statistiques de l'équipe
 */

'use client';

import { Card } from '@/components/ui/card';
import { Users, CheckCircle, Clock, Mail, Shield, UserCheck } from 'lucide-react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { cn } from '@/lib/utils';
import type { TeamStats } from '../types';

interface TeamStatsProps {
  stats: TeamStats;
}

export function TeamStats({ stats }: TeamStatsProps) {
  const statsData = [
    { label: 'Total', value: stats.total, icon: Users, color: 'cyan' },
    { label: 'Actifs', value: stats.active, icon: CheckCircle, color: 'green' },
    { label: 'En attente', value: stats.pending, icon: Clock, color: 'yellow' },
    { label: 'Invitations', value: stats.invites, icon: Mail, color: 'blue' },
    { label: 'Admins', value: stats.byRole.ADMIN + stats.byRole.OWNER, icon: Shield, color: 'purple' },
    { label: 'Membres', value: stats.byRole.MEMBER, icon: UserCheck, color: 'orange' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
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
                  <p className={cn(
                    'text-2xl font-bold mt-1',
                    stat.color === 'cyan' && 'text-cyan-400',
                    stat.color === 'green' && 'text-green-400',
                    stat.color === 'yellow' && 'text-yellow-400',
                    stat.color === 'blue' && 'text-blue-400',
                    stat.color === 'purple' && 'text-purple-400',
                    stat.color === 'orange' && 'text-orange-400',
                  )}>
                    {stat.value}
                  </p>
                </div>
                <div className={cn(
                  'p-3 rounded-lg',
                  stat.color === 'cyan' && 'bg-cyan-500/10',
                  stat.color === 'green' && 'bg-green-500/10',
                  stat.color === 'yellow' && 'bg-yellow-500/10',
                  stat.color === 'blue' && 'bg-blue-500/10',
                  stat.color === 'purple' && 'bg-purple-500/10',
                  stat.color === 'orange' && 'bg-orange-500/10',
                )}>
                  <Icon className={cn(
                    'w-5 h-5',
                    stat.color === 'cyan' && 'text-cyan-400',
                    stat.color === 'green' && 'text-green-400',
                    stat.color === 'yellow' && 'text-yellow-400',
                    stat.color === 'blue' && 'text-blue-400',
                    stat.color === 'purple' && 'text-purple-400',
                    stat.color === 'orange' && 'text-orange-400',
                  )} />
                </div>
              </div>
            </Card>
          </motion>
        );
      })}
    </div>
  );
}


