'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Rocket, Settings } from 'lucide-react';

export type QuickActionItem = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  badge?: string;
};

export function OverviewQuickActions({ actions }: { actions: QuickActionItem[] }) {
  return (
    <Card className="p-6 bg-slate-900/50 border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Rocket className="w-5 h-5 text-cyan-400" />
          Actions Rapides
        </h2>
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Settings className="w-4 h-4" />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={action.href}>
              <div className="group p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 transition-all cursor-pointer">
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}
                >
                  {action.icon}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white text-sm">{action.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{action.description}</p>
                  </div>
                  {action.badge && (
                    <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] rounded-full">
                      {action.badge}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
