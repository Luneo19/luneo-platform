'use client';

/**
 * Page Crédits - Refactorée avec composants dans ./components/
 */

import { memo } from 'react';
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
  const state = useCreditsPage();

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto" />
          <p className="mt-4 text-gray-300">Chargement des crédits...</p>
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
        <TabsList className="bg-gray-900/50 border border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-600">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="packs" className="data-[state=active]:bg-cyan-600">Packs ({state.creditPacks.length})</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-cyan-600">Historique ({state.filteredTransactions.length})</TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-cyan-600">Statistiques</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-cyan-600">Paramètres</TabsTrigger>
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
