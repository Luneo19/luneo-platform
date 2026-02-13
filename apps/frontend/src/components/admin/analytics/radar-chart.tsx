/**
 * Radar Chart Component
 * Advanced radar/spider chart for multi-dimensional analysis
 */

'use client';

import React from 'react';
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface RadarChartDataPoint {
  category: string;
  [key: string]: string | number;
}

export interface RadarSeries {
  key: string;
  name: string;
  color: string;
  fillOpacity?: number;
}

export interface RadarChartProps {
  title: string;
  data: RadarChartDataPoint[];
  series: RadarSeries[];
  isLoading?: boolean;
  className?: string;
  showLegend?: boolean;
  maxValue?: number;
}

export function RadarChart({
  title,
  data,
  series,
  isLoading = false,
  className,
  showLegend = true,
  maxValue,
}: RadarChartProps) {
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

  const calculatedMaxValue = maxValue || Math.max(
    ...data.flatMap((point) =>
      series.map((s) => Number(point[s.key]) || 0)
    )
  ) * 1.2;

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string; payload?: { category?: string } }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-white mb-2">{payload[0]?.payload?.category}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
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
        <p className="text-sm text-zinc-400 mt-2">
          Multi-dimensional analysis across categories
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RechartsRadarChart data={data}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, calculatedMaxValue]}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {series.map(({ key, name, color, fillOpacity = 0.6 }) => (
              <Radar
                key={key}
                name={name}
                dataKey={key}
                stroke={color}
                fill={color}
                fillOpacity={fillOpacity}
              />
            ))}
          </RechartsRadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
