'use client';

import { useI18n } from '@/i18n/useI18n';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Tabs } from '@/components/ui/tabs';
import { memo } from 'react';
import { AffiliateAdvancedSections } from './components/AffiliateAdvancedSections';
import { AffiliateHeader } from './components/AffiliateHeader';
import { AffiliateStatsCards } from './components/AffiliateStatsCards';
import { AffiliateTabPanels } from './components/AffiliateTabPanels';
import { AffiliateTabsList } from './components/AffiliateTabsList';
import { CreateLinkModal } from './components/CreateLinkModal';
import { PayoutModal } from './components/PayoutModal';
import { PendingPayoutAlert } from './components/PendingPayoutAlert';
import { useAffiliatePage } from './components/hooks/useAffiliatePage';

function AffiliatePageContent() {
  const { t } = useI18n();
  const {
    loading,
    activeTab,
    setActiveTab,
    showCreateLinkModal,
    setShowCreateLinkModal,
    showPayoutModal,
    setShowPayoutModal,
    filterStatus,
    setFilterStatus,
    stats,
    affiliateLinks,
    referrals,
    commissions,
    handleCopyLink,
    handleCreateLink,
    minPayoutThreshold,
  } = useAffiliatePage();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto" />
          <p className="mt-4 text-white/60">{t('affiliate.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <AffiliateHeader
        onRequestPayout={() => setShowPayoutModal(true)}
        onCreateLink={() => setShowCreateLinkModal(true)}
        canRequestPayout={stats.pendingCommissions >= minPayoutThreshold}
      />
      <AffiliateStatsCards stats={stats} />
      <PendingPayoutAlert
        pendingCommissions={stats.pendingCommissions}
        onRequestPayout={() => setShowPayoutModal(true)}
        minThreshold={minPayoutThreshold}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <AffiliateTabsList
          linksCount={affiliateLinks.length}
          referralsCount={referrals.length}
          commissionsCount={commissions.length}
        />
        <AffiliateTabPanels
          stats={stats}
          affiliateLinks={affiliateLinks}
          referrals={referrals}
          commissions={commissions}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          onCreateLink={() => setShowCreateLinkModal(true)}
          onCopyLink={handleCopyLink}
          minPayoutThreshold={minPayoutThreshold}
        />
      </Tabs>
      <CreateLinkModal
        open={showCreateLinkModal}
        onOpenChange={setShowCreateLinkModal}
        onCreate={handleCreateLink}
      />
      <PayoutModal
        open={showPayoutModal}
        onOpenChange={setShowPayoutModal}
        pendingCommissions={stats.pendingCommissions}
      />
      <AffiliateAdvancedSections />
    </div>
  );
}

const MemoizedAffiliatePageContent = memo(AffiliatePageContent);

export default function AffiliatePage() {
  return (
    <ErrorBoundary level="page" componentName="AffiliatePage">
      <MemoizedAffiliatePageContent />
    </ErrorBoundary>
  );
}