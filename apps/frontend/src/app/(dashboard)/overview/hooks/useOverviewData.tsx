'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  useDashboardStats,
  useDashboardChartData,
  useDashboardUsage,
} from '@/lib/hooks/api/useDashboard';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useDemoMode } from '@/hooks/useDemoMode';
import type { StatItem } from '../components/OverviewStatsGrid';
import type { ActivityItem } from '../components/OverviewRecentActivity';
import type { TopDesignItem } from '../components/OverviewTopDesigns';
import type { QuickActionItem } from '../components/OverviewQuickActions';
import type { GoalItem } from '../components/OverviewGoals';
import type { NotificationItem } from '../components/OverviewNotifications';
import { Sparkles, Palette, Box, Layers } from 'lucide-react';

export type Period = '24h' | '7d' | '30d' | '90d';

export function useOverviewData() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('7d');
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  const { data: dashboardStats, isLoading: statsLoading, error: statsError, refetch: refreshStats } = useDashboardStats(selectedPeriod);
  const { data: chartData, isLoading: chartLoading } = useDashboardChartData(selectedPeriod);
  const { data: usageData } = useDashboardUsage(selectedPeriod);
  const { notifications, loading: notificationsLoading } = useNotifications(10);
  const { isDemoMode } = useDemoMode();

  const loading = statsLoading || chartLoading;
  const error = statsError?.message || null;

  const stats = useMemo(() => {
    if (!dashboardStats?.overview) return [];
    const views = usageData?.views ?? 0;
    const downloads = usageData?.downloads ?? 0;
    return [
      {
        title: 'Designs créés',
        value: dashboardStats.overview.designs.toLocaleString('fr-FR'),
        change: `+${dashboardStats.period.designs}`,
        changeType: 'positive' as const,
        icon: 'Palette',
      },
      {
        title: 'Vues totales',
        value: views.toLocaleString('fr-FR'),
        change: usageData?.viewsChange ?? '+0%',
        changeType: 'positive' as const,
        icon: 'Eye',
      },
      {
        title: 'Téléchargements',
        value: downloads.toLocaleString('fr-FR'),
        change: usageData?.downloadsChange ?? '+0%',
        changeType: 'positive' as const,
        icon: 'Download',
      },
      {
        title: 'Revenus',
        value: `€${dashboardStats.period.revenue.toFixed(2)}`,
        change: `+${dashboardStats.period.orders} commandes`,
        changeType: (dashboardStats.period.revenue > 0 ? 'positive' : 'negative') as 'positive' | 'negative',
        icon: 'DollarSign',
      },
    ];
  }, [dashboardStats, usageData]);

  const displayStats: StatItem[] =
    stats.length > 0
      ? stats
      : [
          { title: 'Designs créés', value: '0', change: '+0', changeType: 'positive', icon: 'Palette' },
          { title: 'Vues totales', value: '0', change: '+0%', changeType: 'positive', icon: 'Eye' },
          { title: 'Téléchargements', value: '0', change: '+0%', changeType: 'positive', icon: 'Download' },
          { title: 'Revenus', value: '€0.00', change: '+0 commandes', changeType: 'positive', icon: 'DollarSign' },
        ];

  const recentActivity: ActivityItem[] = useMemo(() => {
    if (!dashboardStats?.recent) return [];
    return [
      ...(dashboardStats.recent.designs?.slice(0, 3) || []).map((design) => ({
        id: design.id,
        type: 'design',
        title: design.prompt || 'Design créé',
        description: `Design ${design.status || 'créé'}`,
        time: design.created_at,
        status: design.status,
        image: design.preview_url,
      })),
      ...(dashboardStats.recent.orders?.slice(0, 2) || []).map((order) => ({
        id: order.id,
        type: 'order',
        title: `Commande ${order.status}`,
        description: `Montant: €${order.total_amount.toFixed(2)}`,
        time: order.created_at,
        status: order.status,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  }, [dashboardStats]);

  const topDesigns: TopDesignItem[] = useMemo(() => {
    if (!dashboardStats?.recent?.designs) return [];
    const designViews = usageData?.designViews ?? {};
    const designLikes = usageData?.designLikes ?? {};
    return dashboardStats.recent.designs.slice(0, 5).map((design) => ({
      id: design.id,
      title: design.prompt || 'Design sans titre',
      image: design.preview_url || '/placeholder-design.jpg',
      views: designViews[design.id] ?? 0,
      likes: designLikes[design.id] ?? 0,
      created_at: design.created_at,
    }));
  }, [dashboardStats, usageData]);

  const quickActions: QuickActionItem[] = useMemo(
    () => [
      {
        id: 'ai-studio',
        title: 'AI Studio',
        description: 'Générer des designs avec IA',
        icon: <Sparkles className="w-6 h-6" />,
        href: '/dashboard/ai-studio',
        color: 'from-purple-500 to-pink-500',
        badge: 'Populaire',
      },
      {
        id: 'customizer',
        title: 'Customizer',
        description: 'Éditeur de personnalisation',
        icon: <Palette className="w-6 h-6" />,
        href: '/dashboard/customizer',
        color: 'from-cyan-500 to-blue-500',
      },
      {
        id: '3d-config',
        title: 'Configurateur 3D',
        description: 'Visualisation produits 3D',
        icon: <Box className="w-6 h-6" />,
        href: '/dashboard/configurator-3d',
        color: 'from-orange-500 to-red-500',
      },
      {
        id: 'library',
        title: 'Ma Bibliothèque',
        description: 'Gérer mes designs',
        icon: <Layers className="w-6 h-6" />,
        href: '/dashboard/library',
        color: 'from-green-500 to-emerald-500',
      },
    ],
    []
  );

  const goals: GoalItem[] = useMemo(
    () => [
      { label: 'Designs créés', current: 45, target: 100, color: 'stroke-cyan-500' },
      { label: 'Conversions', current: 78, target: 100, color: 'stroke-green-500' },
      { label: 'Engagement', current: 62, target: 100, color: 'stroke-purple-500' },
    ],
    []
  );

  const refresh = useCallback(() => {
    refreshStats();
  }, [refreshStats]);

  const handlePeriodChange = useCallback((period: Period) => {
    setSelectedPeriod(period);
  }, []);

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
    notifications: notifications as NotificationItem[],
    showAllNotifications,
    setShowAllNotifications,
    isDemoMode,
  };
}
