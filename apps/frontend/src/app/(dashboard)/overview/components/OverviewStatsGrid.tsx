'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Download, Eye, Palette, Zap } from 'lucide-react';
import { MiniBarChart } from './MiniBarChart';

export type StatItem = {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
};

const colorMap: Record<string, { gradient: string; bg: string; chart: string }> = {
  'Designs créés': { gradient: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-500/10', chart: 'bg-cyan-500' },
  'Vues totales': { gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/10', chart: 'bg-purple-500' },
  'Téléchargements': { gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-500/10', chart: 'bg-green-500' },
  'Revenus': { gradient: 'from-orange-500 to-amber-500', bg: 'bg-orange-500/10', chart: 'bg-orange-500' },
};

const iconMap: Record<string, React.ReactNode> = {
  Palette: <Palette className="w-5 h-5" />,
  Eye: <Eye className="w-5 h-5" />,
  Download: <Download className="w-5 h-5" />,
  DollarSign: <DollarSign className="w-5 h-5" />,
};

export function OverviewStatsGrid({
  stats,
  chartData,
}: {
  stats: StatItem[];
  chartData?: { designs?: number[]; views?: number[]; revenue?: number[] };
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const colors = colorMap[stat.title] || {
          gradient: 'from-slate-500 to-slate-600',
          bg: 'bg-slate-500/10',
          chart: 'bg-slate-500',
        };
        const chartValues =
          stat.title === 'Designs créés'
            ? chartData?.designs || []
            : stat.title === 'Vues totales'
              ? chartData?.views || []
              : stat.title === 'Revenus'
                ? chartData?.revenue || []
                : [15, 22, 18, 25, 20, 28, 24];

        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card className="p-5 bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${colors.bg}`}>
                  <div className={`bg-gradient-to-br ${colors.gradient} bg-clip-text text-transparent`}>
                    {iconMap[stat.icon] || <Zap className="w-5 h-5" />}
                  </div>
                </div>
                <div
                  className={`flex items-center text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {stat.changeType === 'positive' ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {stat.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-sm text-slate-400 mb-3">{stat.title}</p>
              <MiniBarChart data={chartValues} color={colors.chart} />
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
