/**
 * Heatmap Chart Component
 * Advanced visualization for time-series data with intensity mapping
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface HeatmapDataPoint {
  date: string;
  hour: number;
  value: number;
  label?: string;
}

export interface HeatmapChartProps {
  title: string;
  data: HeatmapDataPoint[];
  isLoading?: boolean;
  className?: string;
  colorScale?: 'blue' | 'green' | 'red' | 'purple';
}

const COLOR_SCALES = {
  blue: ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'],
  green: ['#14532d', '#22c55e', '#4ade80', '#86efac', '#dcfce7'],
  red: ['#7f1d1d', '#ef4444', '#f87171', '#fca5a5', '#fee2e2'],
  purple: ['#581c87', '#a855f7', '#c084fc', '#d8b4fe', '#f3e8ff'],
};

export function HeatmapChart({
  title,
  data,
  isLoading = false,
  className,
  colorScale = 'blue',
}: HeatmapChartProps) {
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

  // Group data by date and hour
  const groupedData = data.reduce((acc, point) => {
    const key = `${point.date}-${point.hour}`;
    if (!acc[key]) {
      acc[key] = { date: point.date, hour: point.hour, value: 0, count: 0 };
    }
    acc[key].value += point.value;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { date: string; hour: number; value: number; count: number }>);

  // Calculate min/max for normalization
  const values = Object.values(groupedData).map((d) => d.value / d.count);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Get unique dates and hours
  const dates = Array.from(new Set(data.map((d) => d.date))).sort();
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Get color for value
  const getColor = (value: number) => {
    const normalized = (value - minValue) / range;
    const index = Math.min(Math.floor(normalized * COLOR_SCALES[colorScale].length), COLOR_SCALES[colorScale].length - 1);
    return COLOR_SCALES[colorScale][index];
  };

  return (
    <Card className={cn('bg-zinc-800 border-zinc-700', className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
        <p className="text-sm text-zinc-400 mt-2">
          Activity intensity by date and hour
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Hour labels */}
            <div className="flex mb-2">
              <div className="w-24 text-xs text-zinc-400 font-medium">Date</div>
              <div className="flex-1 grid grid-cols-24 gap-1">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="text-xs text-zinc-400 text-center"
                    title={`${hour}:00`}
                  >
                    {hour % 6 === 0 ? hour : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap cells */}
            <div className="space-y-1">
              {dates.map((date) => {
                const dateStr = new Date(date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div key={date} className="flex items-center">
                    <div className="w-24 text-xs text-zinc-300 font-medium">{dateStr}</div>
                    <div className="flex-1 grid grid-cols-24 gap-1">
                      {hours.map((hour) => {
                        const key = `${date}-${hour}`;
                        const cellData = groupedData[key];
                        const value = cellData ? cellData.value / cellData.count : 0;
                        const color = getColor(value);

                        return (
                          <div
                            key={hour}
                            className="h-6 rounded cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: color }}
                            title={`${dateStr} ${hour}:00 - Value: ${value.toFixed(2)}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>Less</span>
                <div className="flex gap-1">
                  {COLOR_SCALES[colorScale].map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
              <div className="text-xs text-zinc-400">
                Min: {minValue.toFixed(1)} | Max: {maxValue.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
