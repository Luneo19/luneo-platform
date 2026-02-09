'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DemoModeBanner } from '@/components/demo/DemoModeBanner';
import { useOverviewData } from './hooks/useOverviewData';
import { OverviewHeader } from './components/OverviewHeader';
import { OverviewStatsGrid } from './components/OverviewStatsGrid';
import { OverviewQuickActions } from './components/OverviewQuickActions';
import { OverviewRecentActivity } from './components/OverviewRecentActivity';
import { OverviewTopDesigns } from './components/OverviewTopDesigns';
import { OverviewGoals } from './components/OverviewGoals';
import { OverviewNotifications } from './components/OverviewNotifications';
import { OverviewHelpCard } from './components/OverviewHelpCard';
import { OverviewErrorBanner } from './components/OverviewErrorBanner';
import { OverviewLoadingState } from './components/OverviewLoadingState';
import { OverviewErrorState } from './components/OverviewErrorState';

export default function DashboardPage() {
  const {
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
    notifications,
    showAllNotifications,
    setShowAllNotifications,
    isDemoMode,
  } = useOverviewData();

  if (loading) return <OverviewLoadingState />;
  if (error && !displayStats.length && !recentActivity.length) {
    return <OverviewErrorState error={error} onRetry={refresh} />;
  }

  return (
    <ErrorBoundary level="page" componentName="DashboardOverview">
      <div className="space-y-[var(--dash-gap)]">
        <DemoModeBanner />
        <OverviewHeader
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
          onRefresh={refresh}
          isDemoMode={isDemoMode}
        />
        {error && <OverviewErrorBanner error={error} onRetry={refresh} />}
        <OverviewStatsGrid stats={displayStats} chartData={chartData} />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-[var(--dash-gap)]">
          <div className="xl:col-span-2 space-y-[var(--dash-gap)]">
            <OverviewQuickActions actions={quickActions} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--dash-gap)]">
              <OverviewRecentActivity activities={recentActivity} />
              <OverviewTopDesigns designs={topDesigns} />
            </div>
          </div>
          <div className="space-y-[var(--dash-gap)]">
            <OverviewGoals goals={goals} selectedPeriod={selectedPeriod} />
            <OverviewNotifications
              notifications={notifications}
              showAll={showAllNotifications}
              onToggleShowAll={() => setShowAllNotifications((v) => !v)}
            />
            <OverviewHelpCard />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
