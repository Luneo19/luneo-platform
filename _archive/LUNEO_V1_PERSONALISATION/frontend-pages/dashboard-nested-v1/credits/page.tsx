'use client';

/**
 * Page Crédits - Refactorée avec composants dans ./components/
 */

import { memo } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreditsPage } from './hooks/useCreditsPage';
import { CreditsHeader } from './components/CreditsHeader';
import { CreditsBalanceCard } from './components/CreditsBalanceCard';
import { CreditsStatsGrid } from './components/CreditsStatsGrid';
import { CreditsOverviewTab } from './components/CreditsOverviewTab';
import { CreditsPacksTab } from './components/CreditsPacksTab';
import { CreditsHistoryTab } from './components/CreditsHistoryTab';
import { CreditsStatsTab } from './components/CreditsStatsTab';
import { CreditsSettingsTab } from './components/CreditsSettingsTab';
import { CreditsModals } from './components/CreditsModals';

function CreditsPageContent() {
  const { t } = useI18n();
  const state = useCreditsPage();

  if (state.loading && !state.stats.currentBalance && state.transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] dash-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/10 border-t-purple-500 mx-auto" />
          <p className="mt-4 text-white/60">{t('credits.loading')}</p>
        </div>
      </div>
    );
  }

  if (!state.loading && state.transactions.length === 0 && state.creditPacks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] dash-bg">
        <div className="text-center dash-card rounded-2xl p-8 border border-white/[0.06] max-w-md">
          <p className="text-zinc-400 mb-4">{t('credits.noData')}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90"
          >
            {t('credits.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <CreditsHeader onOpenAutoRefill={() => state.setShowAutoRefillModal(true)} onOpenExport={() => state.setShowExportModal(true)} />
      <CreditsBalanceCard
        stats={state.stats}
        autoRefillEnabled={state.autoRefillEnabled}
        autoRefillThreshold={state.autoRefillThreshold}
        onRecharge={() => state.setActiveTab('packs')}
      />
      <CreditsStatsGrid stats={state.stats} />
      <Tabs value={state.activeTab} onValueChange={(v) => state.setActiveTab(v as typeof state.activeTab)} className="space-y-6">
        <TabsList className="bg-white/[0.04] border border-white/[0.06] p-1 rounded-xl">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=inactive]:text-white/60 rounded-lg">{t('credits.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="packs" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=inactive]:text-white/60 rounded-lg">{t('credits.tabs.packs')} ({state.creditPacks.length})</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=inactive]:text-white/60 rounded-lg">{t('credits.tabs.history')} ({state.filteredTransactions.length})</TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=inactive]:text-white/60 rounded-lg">{t('credits.tabs.stats')}</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=inactive]:text-white/60 rounded-lg">{t('credits.tabs.settings')}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <CreditsOverviewTab filteredTransactions={state.filteredTransactions} creditPacks={state.creditPacks} onPurchase={state.handlePurchase} />
        </TabsContent>
        <TabsContent value="packs" className="space-y-6">
          <CreditsPacksTab creditPacks={state.creditPacks} onPurchase={state.handlePurchase} />
        </TabsContent>
        <TabsContent value="history" className="space-y-6">
          <CreditsHistoryTab
            filteredTransactions={state.filteredTransactions}
            filterType={state.filterType}
            filterDateRange={state.filterDateRange}
            onFilterTypeChange={state.setFilterType}
            onFilterDateRangeChange={state.setFilterDateRange}
            onExport={() => state.setShowExportModal(true)}
          />
        </TabsContent>
        <TabsContent value="stats" className="space-y-6">
          <CreditsStatsTab stats={state.stats} />
        </TabsContent>
        <TabsContent value="settings" className="space-y-6">
          <CreditsSettingsTab
            autoRefillEnabled={state.autoRefillEnabled}
            setAutoRefillEnabled={state.setAutoRefillEnabled}
            autoRefillThreshold={state.autoRefillThreshold}
            setAutoRefillThreshold={state.setAutoRefillThreshold}
            autoRefillPack={state.autoRefillPack}
            setAutoRefillPack={state.setAutoRefillPack}
            creditPacks={state.creditPacks}
            onSaveAutoRefill={state.handleEnableAutoRefill}
          />
        </TabsContent>
      </Tabs>
      <CreditsModals
        showPurchaseModal={state.showPurchaseModal}
        setShowPurchaseModal={state.setShowPurchaseModal}
        selectedPack={state.selectedPack}
        creditPacks={state.creditPacks}
        onConfirmPurchase={state.handleConfirmPurchase}
        showAutoRefillModal={state.showAutoRefillModal}
        setShowAutoRefillModal={state.setShowAutoRefillModal}
        autoRefillThreshold={state.autoRefillThreshold}
        setAutoRefillThreshold={state.setAutoRefillThreshold}
        autoRefillPack={state.autoRefillPack}
        setAutoRefillPack={state.setAutoRefillPack}
        creditPacksForSelect={state.creditPacks}
        onEnableAutoRefill={state.handleEnableAutoRefill}
        showExportModal={state.showExportModal}
        setShowExportModal={state.setShowExportModal}
        transactions={state.transactions}
        filterType={state.filterType}
      />
    </div>
  );
}

const MemoizedCreditsPageContent = memo(CreditsPageContent);

export default function CreditsPage() {
  return (
    <ErrorBoundary level="page" componentName="CreditsPage">
      <MemoizedCreditsPageContent />
    </ErrorBoundary>
  );
}
