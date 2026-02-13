/**
 * Area Chart Component
 * Advanced area chart with gradient fills and multiple series
 */

'use client';

import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

export interface AreaChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface AreaChartProps {
  title: string;
  data: AreaChartDataPoint[];
  dataKeys: Array<{ key: string; name: string; color: string }>;
  isLoading?: boolean;
  className?: string;
  showLegend?: boolean;
  stacked?: boolean;
}

export function AreaChart({
  title,
  data,
  dataKeys,
  isLoading = false,
  className,
  showLegend = true,
  stacked = false,
}: AreaChartProps) {
  if (isLoading) {
    return (
      <Card className={cn('bg-zinc-800 border-zinc-700', className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-zinc-700/50 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string; payload?: { date?: string } }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm text-zinc-400 mb-2">{payload[0]?.payload?.date}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value ?? 0)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn('bg-zinc-800 border-zinc-700', className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RechartsAreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              {dataKeys.map(({ key, color }) => (
                <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              fontSize={12}
              tickLine={{ stroke: '#9ca3af' }}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={12}
              tickLine={{ stroke: '#9ca3af' }}
              tickFormatter={(value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toString();
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {dataKeys.map(({ key, name, color }, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={name}
                stroke={color}
                fill={`url(#color${key})`}
                stackId={stacked ? '1' : undefined}
              />
            ))}
          </RechartsAreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
