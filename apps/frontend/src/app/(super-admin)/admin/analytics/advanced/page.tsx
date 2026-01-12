/**
 * Advanced Analytics Page
 * Advanced visualizations: Heatmap, Scatter, Area Charts
 */

'use client';

import React, { useState } from 'react';
import { HeatmapChart } from '@/components/admin/analytics/heatmap-chart';
import { ScatterChart } from '@/components/admin/analytics/scatter-chart';
import { AreaChart } from '@/components/admin/analytics/area-chart';
import { LineChart } from '@/components/admin/analytics/line-chart';
import { ComboChart } from '@/components/admin/analytics/combo-chart';
import { RadarChart } from '@/components/admin/analytics/radar-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminOverview } from '@/hooks/admin/use-admin-overview';

export default function AdvancedAnalyticsPage() {
  const { data: overviewData, isLoading } = useAdminOverview();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Mock data for advanced visualizations
  // In production, this would come from API
  const heatmapData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return Array.from({ length: 24 }, (_, hour) => ({
      date: date.toISOString().split('T')[0],
      hour,
      value: Math.random() * 100,
    }));
  }).flat();

  const scatterData = Array.from({ length: 50 }, () => ({
    x: Math.random() * 1000,
    y: Math.random() * 500,
    category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
    size: Math.random() * 20 + 5,
  }));

  const areaData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString().split('T')[0],
      revenue: Math.random() * 10000 + 5000,
      orders: Math.random() * 100 + 50,
      customers: Math.random() * 50 + 20,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Advanced Analytics</h1>
        <p className="text-zinc-400 mt-2">
          Advanced visualizations and correlation analysis
        </p>
      </div>

      <Tabs defaultValue="heatmap" className="space-y-4">
        <TabsList>
          <TabsTrigger value="heatmap">Activity Heatmap</TabsTrigger>
          <TabsTrigger value="scatter">Correlation Analysis</TabsTrigger>
          <TabsTrigger value="area">Trend Analysis</TabsTrigger>
          <TabsTrigger value="line">Line Chart</TabsTrigger>
          <TabsTrigger value="combo">Combo Chart</TabsTrigger>
          <TabsTrigger value="radar">Radar Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap" className="space-y-4">
          <HeatmapChart
            title="User Activity Heatmap"
            data={heatmapData}
            isLoading={isLoading}
            colorScale="blue"
          />
        </TabsContent>

        <TabsContent value="scatter" className="space-y-4">
          <ScatterChart
            title="Revenue vs Orders Correlation"
            data={scatterData}
            xLabel="Revenue ($)"
            yLabel="Orders"
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="area" className="space-y-4">
          <AreaChart
            title="Revenue Trends"
            data={areaData}
            dataKeys={[
              { key: 'revenue', name: 'Revenue', color: '#3b82f6' },
              { key: 'orders', name: 'Orders', color: '#10b981' },
              { key: 'customers', name: 'Customers', color: '#f59e0b' },
            ]}
            isLoading={isLoading}
            stacked={false}
          />
        </TabsContent>

        <TabsContent value="line" className="space-y-4">
          <LineChart
            title="Revenue & Growth Over Time"
            data={areaData}
            dataKeys={[
              { key: 'revenue', name: 'Revenue', color: '#3b82f6' },
              { key: 'orders', name: 'Orders', color: '#10b981' },
            ]}
            isLoading={isLoading}
            showReferenceLine={true}
            referenceLineValue={7000}
            xLabel="Date"
            yLabel="Value"
          />
        </TabsContent>

        <TabsContent value="combo" className="space-y-4">
          <ComboChart
            title="Revenue & Orders Combined"
            data={areaData}
            barSeries={[
              { key: 'revenue', name: 'Revenue', color: '#3b82f6' },
            ]}
            lineSeries={[
              { key: 'orders', name: 'Orders', color: '#10b981' },
              { key: 'customers', name: 'Customers', color: '#f59e0b', yAxisId: 'right' },
            ]}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="radar" className="space-y-4">
          <RadarChart
            title="Performance Metrics"
            data={[
              { category: 'Revenue', current: 85, target: 100 },
              { category: 'Orders', current: 70, target: 90 },
              { category: 'Customers', current: 90, target: 100 },
              { category: 'Retention', current: 75, target: 85 },
              { category: 'Satisfaction', current: 88, target: 95 },
            ]}
            series={[
              { key: 'current', name: 'Current', color: '#3b82f6', fillOpacity: 0.6 },
              { key: 'target', name: 'Target', color: '#10b981', fillOpacity: 0.3 },
            ]}
            isLoading={isLoading}
            maxValue={100}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
