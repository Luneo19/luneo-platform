'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';
import { SessionsTable } from './SessionsTable';
import { ToolUsageChart } from './ToolUsageChart';
import { ConversionFunnel } from './ConversionFunnel';
import { PopularElementsChart } from './PopularElementsChart';

interface AnalyticsMetrics {
  sessions: number;
  designsSaved: number;
  exports: number;
  conversions: number;
  revenue: number;
  sessionsChange: number;
  designsSavedChange: number;
  exportsChange: number;
  conversionsChange: number;
  revenueChange: number;
}

interface CustomizerAnalyticsProps {
  customizerId: string;
}

export function CustomizerAnalytics({ customizerId }: CustomizerAnalyticsProps) {
  const [dateFrom, setDateFrom] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const result = await api.get<AnalyticsMetrics>(
        `/api/v1/visual-customizer/customizers/${customizerId}/analytics`,
        {
          params: {
            from: dateFrom.toISOString(),
            to: dateTo.toISOString(),
          },
        }
      );
      setMetrics(result);
    } catch (err) {
      logger.error('Failed to load analytics', { error: err });
    } finally {
      setIsLoading(false);
    }
  };

  const MetricCard = ({
    title,
    value,
    change,
    formatValue,
  }: {
    title: string;
    value: number;
    change?: number;
    formatValue?: (v: number) => string;
  }) => {
    const formattedValue = formatValue ? formatValue(value) : value.toLocaleString();
    const changePercent = change !== undefined ? Math.abs(change) : null;
    const isPositive = change !== undefined && change > 0;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formattedValue}</div>
          {changePercent !== null && (
            <p
              className={cn(
                'text-xs mt-1',
                isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}
            >
              {isPositive ? '+' : '-'}
              {changePercent.toFixed(1)}% from previous period
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">Track customizer performance and usage</p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-[240px] justify-start text-left font-normal')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, 'PPP') : 'From date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={(d: Date | undefined) => d && setDateFrom(d)} />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-[240px] justify-start text-left font-normal')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, 'PPP') : 'To date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={(d: Date | undefined) => d && setDateTo(d)} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Key Metrics */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-20 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : metrics ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="Sessions"
            value={metrics.sessions}
            change={metrics.sessionsChange}
          />
          <MetricCard
            title="Designs Saved"
            value={metrics.designsSaved}
            change={metrics.designsSavedChange}
          />
          <MetricCard
            title="Exports"
            value={metrics.exports}
            change={metrics.exportsChange}
          />
          <MetricCard
            title="Conversions"
            value={metrics.conversions}
            change={metrics.conversionsChange}
          />
          <MetricCard
            title="Revenue"
            value={metrics.revenue}
            change={metrics.revenueChange}
            formatValue={(v) => `$${v.toFixed(2)}`}
          />
        </div>
      ) : null}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tool Usage</CardTitle>
            <CardDescription>Most used tools in the customizer</CardDescription>
          </CardHeader>
          <CardContent>
            <ToolUsageChart customizerId={customizerId} dateFrom={dateFrom} dateTo={dateTo} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Elements</CardTitle>
            <CardDescription>Distribution of element types used</CardDescription>
          </CardHeader>
          <CardContent>
            <PopularElementsChart customizerId={customizerId} dateFrom={dateFrom} dateTo={dateTo} />
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>User journey through the customizer</CardDescription>
        </CardHeader>
        <CardContent>
          <ConversionFunnel customizerId={customizerId} dateFrom={dateFrom} dateTo={dateTo} />
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>Detailed session data</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionsTable customizerId={customizerId} dateFrom={dateFrom} dateTo={dateTo} />
        </CardContent>
      </Card>
    </div>
  );
}
