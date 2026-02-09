'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
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
    <div className="dash-card rounded-2xl p-5 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          Activité Récente
        </h2>
        <Link href="/dashboard/monitoring">
          <Button variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/[0.04]">
            Voir tout
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
      <div className="space-y-2">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-white/[0.04] rounded-full flex items-center justify-center mx-auto mb-3 border border-white/[0.06]">
              <Clock className="w-6 h-6 text-white/30" />
            </div>
            <p className="text-white/60 text-sm">Aucune activité récente</p>
            <Link href="/dashboard/ai-studio">
              <Button size="sm" className="mt-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white">
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
              className="relative flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              {index > 0 && <div className="dash-glow-line absolute left-4 right-4 top-0" aria-hidden />}
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
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/[0.06]">
                  <Palette className="w-5 h-5 text-purple-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{activity.title}</p>
                <p className="text-xs text-white/30 truncate">{activity.description}</p>
              </div>
              <span className="text-xs text-white/30 flex-shrink-0">
                {new Date(activity.time).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
