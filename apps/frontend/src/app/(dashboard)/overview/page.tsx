'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useOverviewData } from './hooks/useOverviewData';
import { OverviewHeader } from './components/OverviewHeader';
import { OverviewStatsGrid } from './components/OverviewStatsGrid';
import { OverviewPipeline } from './components/OverviewPipeline';
import { OverviewQuickActions } from './components/OverviewQuickActions';
import { OverviewRecentActivity } from './components/OverviewRecentActivity';
import { OverviewTopDesigns } from './components/OverviewTopDesigns';
import { OverviewHelpCard } from './components/OverviewHelpCard';
import { OverviewChecklist } from './components/OverviewChecklist';
import { OverviewErrorBanner } from './components/OverviewErrorBanner';
import { OverviewLoadingState } from './components/OverviewLoadingState';
import { OverviewErrorState } from './components/OverviewErrorState';
import { Sparkles, Layers, TrendingUp, Store, Zap, ChevronRight, Palette } from 'lucide-react';

type SuggestionItem = {
  id: string;
  icon: typeof Layers;
  title: string;
  description: string;
  href: string;
};

type TFunction = (key: string, params?: Record<string, string | number>) => string;

/**
 * Client-side AI suggestions based on user activity.
 * Uses designCount and orderCount from overview data until GET /api/v1/ai/suggestions is implemented.
 * Logic: no designs → first AI design; has designs, no orders → first product; has orders → analytics.
 */
function getAISuggestions(designCount: number, orderCount: number, t: TFunction): SuggestionItem[] {
  const base: SuggestionItem[] = [];

  if (designCount === 0) {
    base.push({
      id: 'first-product',
      icon: Layers,
      title: 'Créez votre premier produit',
      description: 'Ajoutez un produit et configurez la personnalisation',
      href: '/dashboard/products',
    });
  }

  if (designCount > 0 && orderCount === 0) {
    base.push({
      id: 'connect-channel',
      icon: Store,
      title: 'Connectez un canal de vente',
      description: 'Shopify, Widget ou Storefront pour commencer à vendre',
      href: '/dashboard/channels',
    });
  }

  if (orderCount > 0) {
    base.push({
      id: 'production',
      icon: TrendingUp,
      title: 'Configurez la production',
      description: 'Connectez un fournisseur POD pour automatiser',
      href: '/dashboard/production',
    });
  }

  base.push(
    {
      id: 'ai-generate',
      icon: Sparkles,
      title: 'Générez des designs par IA',
      description: 'Créez des visuels uniques en quelques secondes',
      href: '/dashboard/ai-studio',
    },
    {
      id: 'shopify',
      icon: Store,
      title: 'Intégration Shopify',
      description: 'Connectez votre boutique en 2 clics',
      href: '/dashboard/channels',
    },
    {
      id: 'templates',
      icon: Zap,
      title: 'Parcourir les templates',
      description: 'Démarrez avec des modèles prêts à l\'emploi',
      href: '/dashboard/library',
    }
  );

  return base.slice(0, 4);
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
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
    designCount,
    orderCount,
  } = useOverviewData();

  const { t } = useI18n();
  const aiSuggestions = getAISuggestions(designCount, orderCount, t);
  useEffect(() => {
    if (searchParams.get('credits_purchase') === 'success') {
      toast({
        title: t('creditsToast.creditsPurchased'),
        description: t('creditsToast.creditsPurchasedDesc'),
      });
      const url = new URL(window.location.href);
      url.searchParams.delete('credits_purchase');
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, toast, t]);

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

        {/* Pipeline visuel — Du design à la livraison */}
        <OverviewPipeline
          products={designCount}
          selling={designCount > 0 ? Math.max(1, Math.floor(designCount * 0.7)) : 0}
          orders={orderCount}
          inProduction={orderCount > 0 ? Math.max(0, Math.floor(orderCount * 0.2)) : 0}
          delivered={orderCount > 0 ? Math.max(0, Math.floor(orderCount * 0.6)) : 0}
        />

        {/* Checklist d'onboarding — visible tant que pas completee */}
        <OverviewChecklist
          productCount={designCount}
          hasCustomizer={designCount > 0}
          hasChannel={designCount > 0}
          orderCount={orderCount}
          hasProduction={false}
        />

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
                {aiSuggestions.map((item) => {
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
