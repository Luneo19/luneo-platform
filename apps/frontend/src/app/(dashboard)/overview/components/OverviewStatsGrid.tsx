'use client';

import React from 'react';
import { LazyMotionDiv as MotionDiv } from '@/lib/performance/dynamic-motion';
import { TrendingUp, TrendingDown, DollarSign, Download, Eye, Palette, Zap, Package, FileText } from 'lucide-react';
import { MiniBarChart } from './MiniBarChart';

export type StatItem = {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
};

const colorByIcon: Record<string, { gradient: string; bg: string; chart: string }> = {
  Package: { gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/10', chart: 'bg-purple-500' },
  FileText: { gradient: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-500/10', chart: 'bg-cyan-500' },
  Palette: { gradient: 'from-emerald-500 to-cyan-500', bg: 'bg-emerald-500/10', chart: 'bg-emerald-500' },
  DollarSign: { gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10', chart: 'bg-amber-500' },
  Eye: { gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/10', chart: 'bg-purple-500' },
  Download: { gradient: 'from-emerald-500 to-cyan-500', bg: 'bg-emerald-500/10', chart: 'bg-emerald-500' },
};

const iconMap: Record<string, React.ReactNode> = {
  Package: <Package className="w-5 h-5" />,
  FileText: <FileText className="w-5 h-5" />,
  Palette: <Palette className="w-5 h-5" />,
  Eye: <Eye className="w-5 h-5" />,
  Download: <Download className="w-5 h-5" />,
  DollarSign: <DollarSign className="w-5 h-5" />,
};

const chartDataByIcon: Record<string, 'designs' | 'views' | 'revenue'> = {
  Package: 'designs',
  Palette: 'designs',
  FileText: 'views',
  Eye: 'views',
  DollarSign: 'revenue',
  Download: 'designs',
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
        const colors = colorByIcon[stat.icon] || {
          gradient: 'from-purple-500 to-pink-500',
          bg: 'bg-purple-500/10',
          chart: 'bg-purple-500',
        };
        const chartKey = chartDataByIcon[stat.icon];
        const chartValues = chartKey && chartData ? (chartData[chartKey] || []) : [];

        return (
          <MotionDiv
            key={stat.icon + index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="dash-card-glow relative overflow-hidden rounded-2xl p-5 border border-white/[0.06]"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${colors.bg} [&_svg]:text-white`}>
                {iconMap[stat.icon] || <Zap className="w-5 h-5 text-purple-400" />}
              </div>
              <div
                className={`flex items-center text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-emerald-400' : 'text-red-400'
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
            <p className="text-sm text-white/40 mb-3">{stat.title}</p>
            <MiniBarChart data={chartValues} color={colors.chart} />
          </MotionDiv>
        );
      })}
    </div>
  );
}
