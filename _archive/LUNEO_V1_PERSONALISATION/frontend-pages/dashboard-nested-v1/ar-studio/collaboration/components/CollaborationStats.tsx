/**
 * Statistiques de collaboration AR
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Folder, Users, MessageSquare, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollaborationStatsProps {
  totalProjects: number;
  totalMembers: number;
  activeMembers: number;
  totalComments: number;
  totalActivities: number;
}

export function CollaborationStats({
  totalProjects,
  totalMembers,
  activeMembers,
  totalComments,
  totalActivities,
}: CollaborationStatsProps) {
  const stats = [
    {
      label: 'Projets',
      value: totalProjects,
      icon: Folder,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Membres',
      value: totalMembers,
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      subtitle: `${activeMembers} actifs`,
    },
    {
      label: 'Commentaires',
      value: totalComments,
      icon: MessageSquare,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Activités',
      value: totalActivities,
      icon: Activity,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className={cn('border-gray-700', stat.bgColor)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={cn('w-5 h-5', stat.color)} />
              </div>
              <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
              <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}



