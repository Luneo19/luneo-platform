'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useOverviewData } from './hooks/useOverviewData';
import { OverviewHeader } from './components/OverviewHeader';
import { OverviewStatsGrid } from './components/OverviewStatsGrid';
import { OverviewQuickActions } from './components/OverviewQuickActions';
import { OverviewRecentActivity } from './components/OverviewRecentActivity';
import { OverviewTopDesigns } from './components/OverviewTopDesigns';
import { OverviewHelpCard } from './components/OverviewHelpCard';
import { OverviewErrorBanner } from './components/OverviewErrorBanner';
import { OverviewLoadingState } from './components/OverviewLoadingState';
import { OverviewErrorState } from './components/OverviewErrorState';
import { Sparkles, Layers, TrendingUp, Store, Zap, ChevronRight } from 'lucide-react';

// TODO: Replace with personalized suggestions from /api/v1/ai/suggestions
// based on user behavior and current plan usage
const AI_SUGGESTIONS = [
  {
    id: 'batch',
    icon: Layers,
    title: 'Génération par lot',
    description: 'Créez plusieurs designs en une fois pour gagner du temps.',
    href: '/dashboard/ai-studio',
  },
  {
    id: 'optimize',
    icon: TrendingUp,
    title: 'Optimisez vos designs populaires',
    description: 'Identifiez et améliorez vos créations les plus vues.',
    href: '/dashboard/analytics',
  },
  {
    id: 'shopify',
    icon: Store,
    title: 'Intégration Shopify',
    description: 'Connectez votre boutique et synchronisez vos produits.',
    href: '/dashboard/integrations-dashboard',
  },
  {
    id: 'templates',
    icon: Zap,
    title: 'Templates personnalisables',
    description: 'Démarrez à partir de modèles prêts à l\'emploi.',
    href: '/dashboard/templates',
  },
] as const;

export default function DashboardPage() {
  useEffect(() => {
    fetch('/api/onboarding/progress', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const progress = data?.data ?? data;
        if (progress && progress.completed === false) {
          window.location.href = '/onboarding';
        } else if (progress && progress.organization && !progress.organization.onboardingCompletedAt && (progress.currentStep ?? 0) < 6) {
          window.location.href = '/onboarding';
        }
      })
      .catch(() => {});
  }, []);

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
  } = useOverviewData();

  if (loading) return <OverviewLoadingState />;
  if (error && !displayStats.length && !recentActivity.length) {
    return <OverviewErrorState error={error} onRetry={refresh} />;
  }

  return (
    <ErrorBoundary level="page" componentName="DashboardOverview">
      <div className="min-h-screen bg-dark-bg text-white space-y-[var(--dash-gap)]">
        <OverviewHeader
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
          onRefresh={refresh}
        />
        {error && <OverviewErrorBanner error={error} onRetry={refresh} />}
        <OverviewStatsGrid stats={displayStats} chartData={chartData} />

        {/* Espace de travail (2/3) | Suggestions IA (1/3) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-[var(--dash-gap)]">
          <div className="xl:col-span-2 space-y-[var(--dash-gap)]">
            <OverviewQuickActions actions={quickActions} />
            <OverviewRecentActivity activities={recentActivity} />
          </div>
          <div className="xl:col-span-1">
            <div className="dash-card rounded-2xl p-5 border border-white/[0.06] h-full">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Suggestions IA
              </h2>
              <div className="space-y-3">
                {AI_SUGGESTIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.id} href={item.href}>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.06] transition-all cursor-pointer group">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/20 transition-colors">
                            <Icon className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{item.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white flex-shrink-0 mt-0.5" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Top Designs - full width */}
        <OverviewTopDesigns designs={topDesigns} />

        <OverviewHelpCard />
      </div>
    </ErrorBoundary>
  );
}
