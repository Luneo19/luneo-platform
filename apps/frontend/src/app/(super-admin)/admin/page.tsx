/**
 * ★★★ SUPER ADMIN DASHBOARD OVERVIEW ★★★
 * Page principale du Super Admin Dashboard
 * Intègre tous les widgets et composants créés
 * Design: dark glassmorphism (dash-card, dash-badge)
 */

'use client';

import React from 'react';
import { KPICard } from '@/components/admin/widgets/kpi-card';
import { ActivityFeed } from '@/components/admin/widgets/activity-feed';
import { QuickActions } from '@/components/admin/widgets/quick-actions';
import { RecentCustomers } from '@/components/admin/widgets/recent-customers';
import { RevenueChart } from '@/components/admin/analytics/revenue-chart';
import { PieChartWidget } from '@/components/admin/analytics/pie-chart';
import { BarChartWidget } from '@/components/admin/analytics/bar-chart';
import { useAdminOverview } from '@/hooks/admin/use-admin-overview';
import { DollarSign, Users, TrendingDown, TrendingUp } from 'lucide-react';

export default function AdminOverviewPage() {
  const { data, isLoading, error } = useAdminOverview({ period: 30 });

  if (error) {
    return (
      <div className="space-y-6">
        <div className="dash-card rounded-lg border border-red-500/30 bg-red-500/5 backdrop-blur-sm p-4">
          <p className="text-red-400 text-sm">
            <strong>Erreur :</strong> Impossible de charger les données du dashboard. Veuillez réessayer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
        <p className="text-white/60 mt-2">
          Bienvenue ! Voici un aperçu de votre activité.
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="MRR"
          value={data?.kpis.mrr.value || 0}
          change={data?.kpis.mrr.change}
          changePercent={data?.kpis.mrr.changePercent}
          trend={data?.kpis.mrr.trend || 'neutral'}
          icon={DollarSign}
          description="Monthly Recurring Revenue"
          sparkline={data?.revenueChart.map(d => d.mrr) || []}
          isLoading={isLoading}
        />
        <KPICard
          title="Customers"
          value={data?.kpis.customers.value || 0}
          change={data?.kpis.customers.new}
          trend={data?.kpis.customers.trend || 'neutral'}
          icon={Users}
          description={`${data?.kpis.customers.new || 0} new this period`}
          isLoading={isLoading}
        />
        <KPICard
          title="Churn Rate"
          value={`${(data?.kpis.churnRate.value || 0).toFixed(1)}%`}
          change={data?.kpis.churnRate.change}
          trend={data?.kpis.churnRate.trend || 'neutral'}
          icon={TrendingDown}
          description="Monthly churn rate"
          isLoading={isLoading}
        />
        <KPICard
          title="LTV"
          value={data?.kpis.ltv.value || 0}
          change={data?.kpis.ltv.projected}
          trend={data?.kpis.ltv.trend || 'neutral'}
          icon={TrendingUp}
          description={`Projected: €${(data?.kpis.ltv.projected || 0).toFixed(0)}`}
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart
          data={data?.revenueChart || []}
          isLoading={isLoading}
        />
        <ActivityFeed
          activities={data?.recentActivity || []}
          isLoading={isLoading}
        />
      </div>

      {/* Distribution & Acquisition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data?.planDistribution && data.planDistribution.length > 0 && (
          <PieChartWidget
            title="Revenue by Plan"
            data={data.planDistribution.map(p => ({
              name: p.name,
              value: p.mrr,
            }))}
            isLoading={isLoading}
            innerRadius={60}
          />
        )}
        {data?.acquisitionChannels && data.acquisitionChannels.length > 0 && (
          <BarChartWidget
            title="Acquisition Channels"
            data={data.acquisitionChannels.map(ch => ({
              name: ch.channel,
              value: ch.count,
            }))}
            dataKey="value"
            orientation="horizontal"
            isLoading={isLoading}
            color="#a855f7"
          />
        )}
      </div>

      {/* Quick Actions & Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <RecentCustomers
          customers={data?.recentCustomers || []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
