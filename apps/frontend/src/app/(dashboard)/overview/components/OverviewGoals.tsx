'use client';

import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { ProgressRing } from './ProgressRing';

export type GoalItem = {
  label: string;
  current: number;
  target: number;
  color: string;
};

export function OverviewGoals({
  goals,
  selectedPeriod,
}: {
  goals: GoalItem[];
  selectedPeriod: string;
}) {
  return (
    <div className="dash-card rounded-2xl p-5 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Objectifs
        </h2>
        <span className="text-xs text-white/30">{selectedPeriod}</span>
      </div>
      <div className="space-y-4">
        {goals.map((goal, index) => (
          <motion.div
            key={goal.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-4"
          >
            <div className="relative">
              <ProgressRing progress={goal.current} size={50} strokeWidth={5} color={goal.color} />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {goal.current}%
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{goal.label}</p>
              <p className="text-xs text-white/30">
                {goal.current}/{goal.target} objectif
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
