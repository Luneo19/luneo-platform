'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';

interface FunnelStage {
  stage: string;
  count: number;
  conversionRate: number;
}

interface ConversionFunnelProps {
  customizerId: string;
  dateFrom: Date;
  dateTo: Date;
}

const stages = [
  'Sessions',
  'Interactions',
  'Designs Saved',
  'Exports',
  'Add to Cart',
  'Purchase',
];

export function ConversionFunnel({ customizerId, dateFrom, dateTo }: ConversionFunnelProps) {
  const [data, setData] = useState<FunnelStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [customizerId, dateFrom, dateTo]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await api.get<FunnelStage[]>(
        `/api/v1/customizer/configurations/${customizerId}/analytics/funnel`,
        {
          params: {
            from: dateFrom.toISOString(),
            to: dateTo.toISOString(),
          },
        }
      );
      setData(result);
    } catch (err) {
      logger.error('Failed to load funnel data', { error: err });
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

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="space-y-2">
      {stages.map((stage, index) => {
        const stageData = data.find((d) => d.stage.toLowerCase() === stage.toLowerCase());
        const count = stageData?.count || 0;
        const conversionRate = stageData?.conversionRate || 0;
        const width = maxCount > 0 ? (count / maxCount) * 100 : 0;

        // Create funnel shape using CSS trapezoid
        const funnelWidth = 100 - index * 8; // Decreasing width for funnel effect
        const leftOffset = index * 4; // Center the trapezoid

        return (
          <div key={stage} className="relative">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-32 text-sm font-medium">{stage}</div>
              <div className="flex-1 relative">
                <div
                  className="bg-primary h-12 flex items-center justify-between px-4 text-white transition-all duration-500"
                  style={{
                    width: `${funnelWidth}%`,
                    marginLeft: `${leftOffset}%`,
                    clipPath: index < stages.length - 1 ? 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' : 'none',
                  }}
                >
                  <span className="font-medium">{count.toLocaleString()}</span>
                  {index > 0 && (
                    <span className="text-xs opacity-90">
                      {conversionRate > 0 ? `+${conversionRate.toFixed(1)}%` : '0%'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {index < stages.length - 1 && (
              <div className="h-2 flex justify-center">
                <div className="w-0.5 bg-muted" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
