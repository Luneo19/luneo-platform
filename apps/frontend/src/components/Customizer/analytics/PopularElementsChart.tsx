'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';

interface ElementUsage {
  type: string;
  count: number;
  percentage: number;
}

interface PopularElementsChartProps {
  customizerId: string;
  dateFrom: Date;
  dateTo: Date;
}

const colors = {
  text: 'bg-blue-500',
  image: 'bg-green-500',
  clipart: 'bg-yellow-500',
  shape: 'bg-purple-500',
  drawing: 'bg-pink-500',
  qr: 'bg-indigo-500',
};

export function PopularElementsChart({
  customizerId,
  dateFrom,
  dateTo,
}: PopularElementsChartProps) {
  const [data, setData] = useState<ElementUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [customizerId, dateFrom, dateTo]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await api.get<ElementUsage[]>(
        `/api/v1/customizer/configurations/${customizerId}/analytics/elements`,
        {
          params: {
            from: dateFrom.toISOString(),
            to: dateTo.toISOString(),
          },
        }
      );
      setData(result);
    } catch (err) {
      logger.error('Failed to load elements data', { error: err });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">No data available</div>;
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {data.reduce(
              (acc, item, index) => {
                const startAngle = acc.currentAngle;
                const endAngle = startAngle + (item.percentage / 100) * 360;
                const largeArcFlag = item.percentage > 50 ? 1 : 0;

                const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180);

                const path = [
                  `M 50 50`,
                  `L ${x1} ${y1}`,
                  `A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  'Z',
                ].join(' ');

                const colorClass = colors[item.type as keyof typeof colors] || 'bg-gray-500';
                const colorMap: Record<string, string> = {
                  'bg-blue-500': '#3b82f6',
                  'bg-green-500': '#22c55e',
                  'bg-yellow-500': '#eab308',
                  'bg-purple-500': '#a855f7',
                  'bg-pink-500': '#ec4899',
                  'bg-indigo-500': '#6366f1',
                };

                acc.paths.push(
                  <path
                    key={item.type}
                    d={path}
                    fill={colorMap[colorClass] || '#gray'}
                    className="transition-all duration-500"
                  />
                );

                acc.currentAngle = endAngle;
                return acc;
              },
              { currentAngle: 0, paths: [] as JSX.Element[] }
            ).paths}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{total.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {data.map((item) => {
          const colorClass = colors[item.type as keyof typeof colors] || 'bg-gray-500';
          const colorMap: Record<string, string> = {
            'bg-blue-500': '#3b82f6',
            'bg-green-500': '#22c55e',
            'bg-yellow-500': '#eab308',
            'bg-purple-500': '#a855f7',
            'bg-pink-500': '#ec4899',
            'bg-indigo-500': '#6366f1',
          };

          return (
            <div key={item.type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: colorMap[colorClass] || '#gray' }}
                />
                <span className="text-sm font-medium capitalize">{item.type}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {item.count.toLocaleString()} ({item.percentage.toFixed(1)}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
