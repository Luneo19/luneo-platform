/**
 * ★★★ ADMIN ANALYTICS PAGE ★★★
 * Page Analytics complète avec tabs pour toutes les métriques
 */

'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RevenueChart } from '@/components/admin/analytics/revenue-chart';
import { PieChartWidget } from '@/components/admin/analytics/pie-chart';
import { BarChartWidget } from '@/components/admin/analytics/bar-chart';
import { CohortTable } from '@/components/admin/analytics/cohort-table';
import { FunnelChart } from '@/components/admin/analytics/funnel-chart';
import { KPICard } from '@/components/admin/widgets/kpi-card';
import { useAnalyticsOverview, useCohortAnalysis, useFunnelAnalysis } from '@/hooks/admin/use-analytics';
import { DollarSign, Users, TrendingUp, Percent, Target, Activity } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<number>(30);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview({ period });
  const { cohorts, isLoading: cohortLoading } = useCohortAnalysis({ period: 365 });
  const { funnel, isLoading: funnelLoading } = useFunnelAnalysis({ period });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-zinc-400 mt-2">
            Comprehensive business analytics and insights
          </p>
        </div>
        <Select value={String(period)} onValueChange={(value) => setPeriod(Number(value))}>
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-700 text-white">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="MRR"
          value={formatCurrency(overview?.revenue.mrr || 0)}
          change={overview?.revenue.growthPercent || 0}
          trend={overview?.revenue.growth && overview.revenue.growth >= 0 ? 'up' : 'down'}
          description="vs last period"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          isLoading={overviewLoading}
        />
        <KPICard
          title="Customers"
          value={formatNumber(overview?.customers.total || 0)}
          change={overview?.customers.new || 0}
          changeType="absolute"
          trend="up"
          description="new this period"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          isLoading={overviewLoading}
        />
        <KPICard
          title="Churn Rate"
          value={`${formatNumber(overview?.churn.rate || 0)}%`}
          change={0}
          trend={overview?.churn.trend || 'neutral'}
          description="monthly"
          icon={<Percent className="h-4 w-4 text-muted-foreground" />}
          isLoading={overviewLoading}
        />
        <KPICard
          title="Avg LTV"
          value={formatCurrency(overview?.ltv.average || 0)}
          change={0}
          trend="up"
          description={`Projected: ${formatCurrency(overview?.ltv.projected || 0)}`}
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
          isLoading={overviewLoading}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-zinc-800 border-zinc-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-700">
            Overview
          </TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-zinc-700">
            Revenue
          </TabsTrigger>
          <TabsTrigger value="acquisition" className="data-[state=active]:bg-zinc-700">
            Acquisition
          </TabsTrigger>
          <TabsTrigger value="retention" className="data-[state=active]:bg-zinc-700">
            Retention
          </TabsTrigger>
          <TabsTrigger value="funnel" className="data-[state=active]:bg-zinc-700">
            Funnel
          </TabsTrigger>
          <TabsTrigger value="ltv" className="data-[state=active]:bg-zinc-700">
            LTV Analysis
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart
              data={overview?.revenueChart || []}
              isLoading={overviewLoading}
            />
            <PieChartWidget
              title="Revenue by Plan"
              data={
                overview?.planDistribution?.map((p: any) => ({
                  name: p.name,
                  value: p.mrr,
                })) || []
              }
              isLoading={overviewLoading}
            />
          </div>
          <BarChartWidget
            title="Acquisition Channels"
            data={
              overview?.acquisitionChannels?.map((c: any) => ({
                name: c.channel,
                value: c.count,
              })) || []
            }
            orientation="horizontal"
            isLoading={overviewLoading}
          />
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="mt-6">
          <RevenueChart
            data={overview?.revenueChart || []}
            isLoading={overviewLoading}
          />
        </TabsContent>

        {/* Acquisition Tab */}
        <TabsContent value="acquisition" className="mt-6">
          <BarChartWidget
            title="Acquisition Channels"
            data={
              overview?.acquisitionChannels?.map((c: any) => ({
                name: c.channel,
                value: c.count,
              })) || []
            }
            orientation="horizontal"
            isLoading={overviewLoading}
          />
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention" className="mt-6">
          <CohortTable cohorts={cohorts} isLoading={cohortLoading} />
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="mt-6">
          <FunnelChart funnel={funnel} isLoading={funnelLoading} />
        </TabsContent>

        {/* LTV Tab */}
        <TabsContent value="ltv" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <KPICard
              title="Average LTV"
              value={formatCurrency(overview?.ltv.average || 0)}
              description="Across all customers"
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
              isLoading={overviewLoading}
            />
            <KPICard
              title="Median LTV"
              value={formatCurrency(overview?.ltv.median || 0)}
              description="50th percentile"
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              isLoading={overviewLoading}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
