'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Activity, ChevronRight, Clock, Palette, Plus } from 'lucide-react';

export type ActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  status?: string;
  image?: string;
};

export function OverviewRecentActivity({
  activities,
}: {
  activities: ActivityItem[];
}) {
  return (
    <Card className="p-5 bg-slate-900/50 border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-400" />
          Activité Récente
        </h2>
        <Link href="/dashboard/monitoring">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            Voir tout
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm">Aucune activité récente</p>
            <Link href="/dashboard/ai-studio">
              <Button size="sm" className="mt-3 bg-cyan-600 hover:bg-cyan-700">
                <Plus className="w-4 h-4 mr-1" />
                Créer un design
              </Button>
            </Link>
          </div>
        ) : (
          activities.slice(0, 5).map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              {'image' in activity && activity.image ? (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={activity.image}
                    alt={activity.title}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Palette className="w-5 h-5 text-cyan-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{activity.title}</p>
                <p className="text-xs text-slate-500 truncate">{activity.description}</p>
              </div>
              <span className="text-xs text-slate-600 flex-shrink-0">
                {new Date(activity.time).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </Card>
  );
}
