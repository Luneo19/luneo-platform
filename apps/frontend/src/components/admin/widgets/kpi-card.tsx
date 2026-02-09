/**
 * ★★★ KPI CARD ★★★
 * Carte KPI avec trends, sparkline, et loading states
 * Utilisé dans le dashboard admin pour afficher les métriques principales
 */

'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  sparkline?: number[]; // Données pour le mini graphique
  isLoading?: boolean;
  className?: string;
}

export function KPICard({
  title,
  value,
  change,
  changePercent,
  trend = 'neutral',
  icon: Icon,
  description,
  sparkline,
  isLoading = false,
  className,
}: KPICardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `€${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `€${(val / 1000).toFixed(1)}K`;
      }
      return `€${val.toFixed(0)}`;
    }
    return val;
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-white/60';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={cn('bg-white/[0.03] border-white/[0.06]', className)}>
        <CardHeader className="pb-3">
          <div className="h-4 w-24 bg-white/[0.06] rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 bg-white/[0.06] rounded animate-pulse mb-2" />
          <div className="h-3 w-16 bg-white/[0.06] rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.04] transition-colors', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-white/60">{title}</CardTitle>
        {Icon && (
          <div className="h-8 w-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
            <Icon className="h-4 w-4 text-white/60" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="flex-1">
            <div className="text-2xl font-bold text-white mb-1">
              {formatValue(value)}
            </div>
            {(change !== undefined || changePercent !== undefined) && (
              <div className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
                {getTrendIcon()}
                {changePercent !== undefined && (
                  <span>{changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%</span>
                )}
                {change !== undefined && changePercent === undefined && (
                  <span>{change > 0 ? '+' : ''}{formatValue(change)}</span>
                )}
                <span className="text-white/40 text-xs ml-1">vs last period</span>
              </div>
            )}
            {description && (
              <p className="text-xs text-white/40 mt-1">{description}</p>
            )}
          </div>
          {sparkline && sparkline.length > 0 && (
            <div className="ml-4 h-12 w-20">
              <Sparkline data={sparkline} trend={trend} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Mini graphique sparkline pour les KPIs
 */
function Sparkline({ data, trend }: { data: number[]; trend: 'up' | 'down' | 'neutral' }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const getGradientId = () => `sparkline-gradient-${trend}`;
  const getStrokeColor = () => {
    switch (trend) {
      case 'up':
        return '#22c55e'; // green-500
      case 'down':
        return '#ef4444'; // red-500
      default:
        return '#71717a'; // zinc-500
    }
  };

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={getGradientId()} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={getStrokeColor()} stopOpacity="0.3" />
          <stop offset="100%" stopColor={getStrokeColor()} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={getStrokeColor()}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`0,100 ${points} 100,100`}
        fill={`url(#${getGradientId()})`}
      />
    </svg>
  );
}
