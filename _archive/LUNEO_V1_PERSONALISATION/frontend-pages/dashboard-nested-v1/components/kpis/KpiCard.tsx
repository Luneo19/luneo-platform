'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  DollarSign,
  ShoppingCart,
  Eye,
  Package,
  Users,
  Sparkles,
  Box,
  Layout,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, LucideIcon> = {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  DollarSign,
  ShoppingCart,
  Eye,
  Package,
  Users,
  Sparkles,
  Box,
  Layout,
};

function getIcon(iconName: string): LucideIcon {
  const name = iconName || 'BarChart3';
  return ICON_MAP[name] ?? BarChart3;
}

export interface KpiCardProps {
  slug: string;
  label: string;
  value: number;
  formattedValue: string;
  trend: number;
  icon?: string;
  className?: string;
}

export function KpiCard({
  slug,
  label,
  formattedValue,
  trend,
  icon,
  className,
}: KpiCardProps) {
  const IconComponent = getIcon(icon ?? 'BarChart3');
  const trendPositive = trend > 0;
  const trendNegative = trend < 0;
  const trendZero = trend === 0;

  return (
    <Card
      className={cn(
        'bg-slate-800/50 border-slate-700 text-white p-4',
        className
      )}
      data-kpi-slug={slug}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <IconComponent className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </div>
          <p className="text-xl font-semibold text-white truncate">
            {formattedValue}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {trendPositive && (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            )}
            {trendNegative && (
              <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
            )}
            {trendZero && (
              <Minus className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            )}
            <span
              className={cn(
                'text-xs font-medium',
                trendPositive && 'text-emerald-500',
                trendNegative && 'text-red-500',
                trendZero && 'text-slate-500'
              )}
            >
              {trend > 0 ? '+' : ''}
              {trend}%
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
