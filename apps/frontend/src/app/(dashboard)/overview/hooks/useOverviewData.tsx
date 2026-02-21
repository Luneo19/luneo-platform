'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  useDashboardStats,
  useDashboardChartData,
  useDashboardUsage,
  usePipelineData,
} from '@/lib/hooks/api/useDashboard';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useI18n } from '@/i18n/useI18n';
import type { StatItem } from '../components/OverviewStatsGrid';
import type { ActivityItem } from '../components/OverviewRecentActivity';
import type { TopDesignItem } from '../components/OverviewTopDesigns';
import type { QuickActionItem } from '../components/OverviewQuickActions';
import type { GoalItem } from '../components/OverviewGoals';
import type { NotificationItem } from '../components/OverviewNotifications';
import { Sparkles, Palette, Box, Layers, Package, ShoppingBag, FileText } from 'lucide-react';

export type Period = '24h' | '7d' | '30d' | '90d';

export function useOverviewData() {
  const { t } = useI18n();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('7d');
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  const { data: dashboardStats, isLoading: statsLoading, error: statsError, refetch: refreshStats } = useDashboardStats(selectedPeriod);
  const { data: chartData, isLoading: chartLoading } = useDashboardChartData(selectedPeriod);
  const { data: usageData } = useDashboardUsage(selectedPeriod);
  const { data: pipelineData } = usePipelineData();
  const { notifications, loading: notificationsLoading } = useNotifications(10);

  const loading = statsLoading || chartLoading;
  const error = statsError?.message || null;

  const stats = useMemo(() => {
    if (!dashboardStats?.overview) return [];
    const productsCount = dashboardStats.overview.products ?? dashboardStats.overview.designs ?? 0;
    const ordersCount = dashboardStats.period?.orders ?? 0;
    return [
      {
        title: t('overview.stats.activeProducts'),
        value: productsCount.toLocaleString('fr-FR'),
        change: `+${dashboardStats.period?.designs ?? 0}`,
        changeType: 'positive' as const,
        icon: 'Package',
      },
      {
        title: t('overview.stats.orders'),
        value: ordersCount.toLocaleString('fr-FR'),
        change: `${ordersCount > 0 ? '+' : ''}${ordersCount}`,
        changeType: (ordersCount > 0 ? 'positive' : 'negative') as 'positive' | 'negative',
        icon: 'FileText',
      },
      {
        title: t('overview.designsCreated'),
        value: (dashboardStats.overview.designs ?? 0).toLocaleString('fr-FR'),
        change: `+${dashboardStats.period?.designs ?? 0}`,
        changeType: 'positive' as const,
        icon: 'Palette',
      },
      {
        title: t('dashboard.revenue'),
        value: `€${(dashboardStats.period?.revenue ?? 0).toFixed(2)}`,
        change: `+${dashboardStats.period?.orders ?? 0} ${t('overview.ordersCount')}`,
        changeType: ((dashboardStats.period?.revenue ?? 0) > 0 ? 'positive' : 'negative') as 'positive' | 'negative',
        icon: 'DollarSign',
      },
    ];
  }, [dashboardStats, t]);

  const displayStats: StatItem[] =
    stats.length > 0
      ? stats
      : [
          { title: t('overview.stats.activeProducts'), value: '0', change: '+0', changeType: 'positive', icon: 'Package' },
          { title: t('overview.stats.orders'), value: '0', change: '+0', changeType: 'positive', icon: 'FileText' },
          { title: t('overview.designsCreated'), value: '0', change: '+0', changeType: 'positive', icon: 'Palette' },
          { title: t('dashboard.revenue'), value: '€0.00', change: `+0 ${t('overview.ordersCount')}`, changeType: 'positive', icon: 'DollarSign' },
        ];

  const recentActivity: ActivityItem[] = useMemo(() => {
    if (!dashboardStats?.recent) return [];
    return [
      ...(dashboardStats.recent.designs?.slice(0, 3) || []).map((design) => ({
        id: design.id,
        type: 'design',
        title: design.prompt || t('overview.recentDesignCreated'),
        description: `Design ${design.status || 'créé'}`,
        time: design.created_at,
        status: design.status,
        image: design.preview_url,
      })),
      ...(dashboardStats.recent.orders?.slice(0, 2) || []).map((order) => ({
        id: order.id,
        type: 'order',
        title: t('overview.orderStatus', { status: order.status ?? '' }),
        description: t('overview.orderAmount', { amount: (order.total_amount ?? 0).toFixed(2) }),
        time: order.created_at,
        status: order.status,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  }, [dashboardStats, t]);

  const topDesigns: TopDesignItem[] = useMemo(() => {
    if (!dashboardStats?.recent?.designs) return [];
    const designViews = usageData?.designViews ?? {};
    const designLikes = usageData?.designLikes ?? {};
    return dashboardStats.recent.designs.slice(0, 5).map((design) => ({
      id: design.id,
      title: design.prompt || t('overview.untitledDesign'),
      image: design.preview_url || '/placeholder-design.svg',
      views: designViews[design.id] ?? 0,
      likes: designLikes[design.id] ?? 0,
      created_at: design.created_at,
    }));
  }, [dashboardStats, usageData, t]);

  const quickActions: QuickActionItem[] = useMemo(
    () => [
      {
        id: 'create-product',
        title: t('overview.quickActions.createProduct'),
        description: t('overview.quickActions.createProductDesc'),
        icon: <Package className="w-6 h-6" />,
        href: '/dashboard/products',
        color: 'from-purple-500 to-pink-500',
      },
      {
        id: 'channels',
        title: t('overview.quickActions.connectChannel'),
        description: t('overview.quickActions.connectChannelDesc'),
        icon: <ShoppingBag className="w-6 h-6" />,
        href: '/dashboard/channels',
        color: 'from-cyan-500 to-blue-500',
      },
      {
        id: 'orders',
        title: t('overview.quickActions.viewOrders'),
        description: t('overview.quickActions.viewOrdersDesc'),
        icon: <FileText className="w-6 h-6" />,
        href: '/dashboard/orders',
        color: 'from-orange-500 to-red-500',
      },
      {
        id: 'ai-studio',
        title: t('overview.quickActions.aiGenerate'),
        description: t('overview.quickActions.aiGenerateDesc'),
        icon: <Sparkles className="w-6 h-6" />,
        href: '/dashboard/ai-studio',
        color: 'from-green-500 to-emerald-500',
        badge: 'IA',
      },
    ],
    [t]
  );

  const goals: GoalItem[] = useMemo(() => {
    const designsCreated = dashboardStats?.overview?.designs ?? 0;
    const designsTarget = Math.max(100, Math.ceil(designsCreated / 50) * 50 + 50);

    const conversions = dashboardStats?.period?.orders ?? 0;
    const conversionsTarget = Math.max(50, Math.ceil(conversions / 25) * 25 + 25);

    const views = usageData?.views ?? 0;
    const engagement = views > 0 && designsCreated > 0
      ? Math.min(100, Math.round((views / (designsCreated * 10)) * 100))
      : 0;

    return [
      { label: t('overview.designsCreated'), current: designsCreated, target: designsTarget, color: 'stroke-cyan-500' },
      { label: t('overview.conversions'), current: conversions, target: conversionsTarget, color: 'stroke-green-500' },
      { label: t('overview.engagement'), current: engagement, target: 100, color: 'stroke-purple-500' },
    ];
  }, [dashboardStats, usageData, t]);

  const refresh = useCallback(() => {
    refreshStats();
  }, [refreshStats]);

  const handlePeriodChange = useCallback((period: Period) => {
    setSelectedPeriod(period);
  }, []);

  const designCount = dashboardStats?.overview?.designs ?? 0;
  const orderCount = dashboardStats?.period?.orders ?? 0;

  const pipeline = {
    products: pipelineData?.products ?? 0,
    selling: pipelineData?.selling ?? 0,
    orders: pipelineData?.orders ?? 0,
    inProduction: pipelineData?.inProduction ?? 0,
    delivered: pipelineData?.delivered ?? 0,
  };

  return {
    loading,
    error,
    refresh,
    selectedPeriod,
    handlePeriodChange,
    displayStats,
    chartData,
    recentActivity,
    topDesigns,
    quickActions,
    goals,
    designCount,
    orderCount,
    pipeline,
    notifications: notifications as NotificationItem[],
    showAllNotifications,
    setShowAllNotifications,
  };
}
