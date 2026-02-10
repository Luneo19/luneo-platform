/**
 * ★★★ ADMIN ANALYTICS PAGE ★★★
 * Page Analytics complète avec tabs pour toutes les métriques
 * Design: dark glassmorphism (dash-card, dash-badge)
 * ✅ Données réelles depuis l'API (charts connectés)
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RevenueChart } from '@/components/admin/analytics/revenue-chart';
import { PieChartWidget } from '@/components/admin/analytics/pie-chart';
import { BarChartWidget } from '@/components/admin/analytics/bar-chart';
import { CohortTable } from '@/components/admin/analytics/cohort-table';
import { FunnelChart } from '@/components/admin/analytics/funnel-chart';
import { KPICard } from '@/components/admin/widgets/kpi-card';
import { useAdminOverview } from '@/hooks/admin/use-admin-overview';
import { useCohortAnalysis, useFunnelAnalysis } from '@/hooks/admin/use-analytics';
import { DollarSign, Users, Percent, Target, Activity } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

const PLAN_COLORS: Record<string, string> = {
  FREE: '#6b7280',
  STARTER: '#3b82f6',
  PROFESSIONAL: '#8b5cf6',
  BUSINESS: '#f59e0b',
  ENTERPRISE: '#10b981',
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<number>(30);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: overview, isLoading: overviewLoading } = useAdminOverview({ period });
  const { cohorts, isLoading: cohortLoading } = useCohortAnalysis({ period: 365 });
  const { funnel, isLoading: funnelLoading } = useFunnelAnalysis({ period });

  // Transform revenueChart data for the RevenueChart component
  const revenueChartData = useMemo(() => {
    if (!overview?.revenueChart) return [];
    return overview.revenueChart.map((point) => ({
      date: point.date,
      mrr: point.mrr,
      revenue: point.revenue,
      newCustomers: point.newCustomers,
    }));
  }, [overview?.revenueChart]);

  // Transform planDistribution for PieChartWidget { name, value, color? }
  const planDistributionData = useMemo(() => {
    if (!overview?.planDistribution) return [];
    return overview.planDistribution.map((plan) => ({
      name: plan.name,
      value: plan.count,
      color: PLAN_COLORS[plan.name] || '#9ca3af',
    }));
  }, [overview?.planDistribution]);

  // Transform acquisitionChannels for BarChartWidget { name, value }
  const acquisitionData = useMemo(() => {
    if (!overview?.acquisitionChannels) return [];
    return overview.acquisitionChannels.map((ch) => ({
      name: ch.channel,
      value: ch.count,
    }));
  }, [overview?.acquisitionChannels]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-white/60 mt-2">
            Comprehensive business analytics and insights
          </p>
        </div>
        <Select value={String(period)} onValueChange={(value) => setPeriod(Number(value))}>
          <SelectTrigger className="w-[180px] bg-white/[0.03] border-white/[0.06] text-white hover:bg-white/[0.04] focus:ring-purple-500/40">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a2e] border-white/[0.08] text-white">
            <SelectItem value="7" className="text-white focus:bg-white/[0.06] focus:text-white">Last 7 days</SelectItem>
            <SelectItem value="30" className="text-white focus:bg-white/[0.06] focus:text-white">Last 30 days</SelectItem>
            <SelectItem value="90" className="text-white focus:bg-white/[0.06] focus:text-white">Last 90 days</SelectItem>
            <SelectItem value="365" className="text-white focus:bg-white/[0.06] focus:text-white">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="MRR"
          value={formatCurrency(overview?.revenue?.mrr || 0)}
          change={overview?.revenue?.mrrGrowthPercent || 0}
          trend={overview?.kpis?.mrr?.trend || 'neutral'}
          description="vs last period"
          icon={DollarSign}
          isLoading={overviewLoading}
        />
        <KPICard
          title="Customers"
          value={formatNumber(overview?.kpis?.customers?.value || 0)}
          change={overview?.kpis?.customers?.new || 0}
          trend={overview?.kpis?.customers?.trend || 'neutral'}
          description="new this period"
          icon={Users}
          isLoading={overviewLoading}
        />
        <KPICard
          title="Churn Rate"
          value={`${formatNumber(overview?.churn?.rate || 0)}%`}
          change={overview?.kpis?.churnRate?.change || 0}
          trend={overview?.kpis?.churnRate?.trend || 'neutral'}
          description="monthly"
          icon={Percent}
          isLoading={overviewLoading}
        />
        <KPICard
          title="Avg LTV"
          value={formatCurrency(overview?.ltv?.average || 0)}
          change={0}
          trend={overview?.kpis?.ltv?.trend || 'neutral'}
          description={`Projected: ${formatCurrency(overview?.ltv?.projected || 0)}`}
          icon={Target}
          isLoading={overviewLoading}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="dash-card border-white/[0.06] bg-white/[0.04] p-1 text-white/60">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04] focus-visible:ring-purple-500/40"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="revenue"
            className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04] focus-visible:ring-purple-500/40"
          >
            Revenue
          </TabsTrigger>
          <TabsTrigger
            value="acquisition"
            className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04] focus-visible:ring-purple-500/40"
          >
            Acquisition
          </TabsTrigger>
          <TabsTrigger
            value="retention"
            className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04] focus-visible:ring-purple-500/40"
          >
            Retention
          </TabsTrigger>
          <TabsTrigger
            value="funnel"
            className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04] focus-visible:ring-purple-500/40"
          >
            Funnel
          </TabsTrigger>
          <TabsTrigger
            value="ltv"
            className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04] focus-visible:ring-purple-500/40"
          >
            LTV Analysis
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart
              data={revenueChartData}
              isLoading={overviewLoading}
            />
            <PieChartWidget
              title="Revenue by Plan"
              data={planDistributionData}
              isLoading={overviewLoading}
            />
          </div>
          <BarChartWidget
            title="Acquisition Channels"
            dataKey="value"
            data={acquisitionData}
            orientation="horizontal"
            isLoading={overviewLoading}
          />
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="mt-6">
          <RevenueChart
            data={revenueChartData}
            isLoading={overviewLoading}
          />
        </TabsContent>

        {/* Acquisition Tab */}
        <TabsContent value="acquisition" className="mt-6">
          <BarChartWidget
            title="Acquisition Channels"
            dataKey="value"
            data={acquisitionData}
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
              value={formatCurrency(overview?.ltv?.average || 0)}
              description="Across all customers"
              icon={Target}
              isLoading={overviewLoading}
            />
            <KPICard
              title="Median LTV"
              value={formatCurrency(overview?.ltv?.median || 0)}
              description="50th percentile"
              icon={Activity}
              isLoading={overviewLoading}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
