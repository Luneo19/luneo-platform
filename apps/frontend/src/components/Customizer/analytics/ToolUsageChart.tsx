'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';

interface ToolUsage {
  tool: string;
  usageCount: number;
  uniqueUsers: number;
}

interface ToolUsageChartProps {
  customizerId: string;
  dateFrom: Date;
  dateTo: Date;
}

export function ToolUsageChart({ customizerId, dateFrom, dateTo }: ToolUsageChartProps) {
  const [data, setData] = useState<ToolUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [customizerId, dateFrom, dateTo]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await api.get<ToolUsage[]>(
        `/api/v1/customizer/configurations/${customizerId}/analytics/tool-usage`,
        {
          params: {
            from: dateFrom.toISOString(),
            to: dateTo.toISOString(),
          },
        }
      );
      setData(result);
    } catch (err) {
      logger.error('Failed to load tool usage data', { error: err });
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

  const maxUsage = Math.max(...data.map((d) => d.usageCount));

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-orange-500',
  ];

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const percentage = (item.usageCount / maxUsage) * 100;
        const color = colors[index % colors.length];

        return (
          <div key={item.tool} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${color}`} />
                <span className="font-medium capitalize">{item.tool}</span>
              </div>
              <div className="text-muted-foreground">
                {item.usageCount.toLocaleString()} uses • {item.uniqueUsers} users
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-6 overflow-hidden">
              <div
                className={`h-full ${color} transition-all duration-500 flex items-center justify-end pr-2`}
                style={{ width: `${percentage}%` }}
              >
                {percentage > 10 && (
                  <span className="text-xs text-white font-medium">
                    {item.usageCount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
