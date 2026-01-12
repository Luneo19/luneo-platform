/**
 * Scatter Chart Component
 * Advanced visualization for correlation analysis
 */

'use client';

import React from 'react';
import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ScatterDataPoint {
  x: number;
  y: number;
  name?: string;
  category?: string;
  size?: number;
}

export interface ScatterChartProps {
  title: string;
  data: ScatterDataPoint[];
  xLabel?: string;
  yLabel?: string;
  isLoading?: boolean;
  className?: string;
  showLegend?: boolean;
}

export function ScatterChart({
  title,
  data,
  xLabel = 'X Axis',
  yLabel = 'Y Axis',
  isLoading = false,
  className,
  showLegend = true,
}: ScatterChartProps) {
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

  // Group by category if available
  const categories = Array.from(new Set(data.map((d) => d.category || 'default')));
  const categoryColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg">
          {data.name && (
            <p className="text-sm font-medium text-white mb-2">{data.name}</p>
          )}
          <p className="text-sm text-zinc-400">
            {xLabel}: <span className="text-white">{data.x}</span>
          </p>
          <p className="text-sm text-zinc-400">
            {yLabel}: <span className="text-white">{data.y}</span>
          </p>
          {data.size && (
            <p className="text-sm text-zinc-400">
              Size: <span className="text-white">{data.size}</span>
            </p>
          )}
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
          Correlation analysis: {xLabel} vs {yLabel}
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RechartsScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              type="number"
              dataKey="x"
              name={xLabel}
              stroke="#9ca3af"
              fontSize={12}
              label={{ value: xLabel, position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yLabel}
              stroke="#9ca3af"
              fontSize={12}
              label={{ value: yLabel, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {categories.map((category, index) => {
              const categoryData = data.filter((d) => (d.category || 'default') === category);
              return (
                <Scatter
                  key={category}
                  name={category}
                  data={categoryData}
                  fill={categoryColors[index % categoryColors.length]}
                  shape="circle"
                />
              );
            })}
          </RechartsScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
