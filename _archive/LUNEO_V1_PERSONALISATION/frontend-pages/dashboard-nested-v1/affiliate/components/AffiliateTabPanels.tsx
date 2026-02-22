'use client';

import { TabsContent } from '@/components/ui/tabs';
import { AccessibilityTab } from './tabs/AccessibilityTab';
import { AiMlTab } from './tabs/AiMlTab';
import { CollaborationTab } from './tabs/CollaborationTab';
import { CommissionsTab } from './tabs/CommissionsTab';
import { I18nTab } from './tabs/I18nTab';
import { LinksTab } from './tabs/LinksTab';
import { OverviewTab } from './tabs/OverviewTab';
import { PerformanceTab } from './tabs/PerformanceTab';
import { ReferralsTab } from './tabs/ReferralsTab';
import { SecurityTab } from './tabs/SecurityTab';
import { SettingsTab } from './tabs/SettingsTab';
import { ToolsTab } from './tabs/ToolsTab';
import { WorkflowTab } from './tabs/WorkflowTab';
import type { AffiliateLink, AffiliateStats, Commission, Referral } from './types';

interface AffiliateTabPanelsProps {
  stats: AffiliateStats;
  affiliateLinks: AffiliateLink[];
  referrals: Referral[];
  commissions: Commission[];
  filterStatus: string;
  onFilterChange: (value: string) => void;
  onCreateLink: () => void;
  onCopyLink: (link: AffiliateLink) => void;
  minPayoutThreshold: number;
}

export function AffiliateTabPanels({
  stats,
  affiliateLinks,
  referrals,
  commissions,
  filterStatus,
  onFilterChange,
  onCreateLink,
  onCopyLink,
  minPayoutThreshold,
}: AffiliateTabPanelsProps) {
  return (
    <>
      <TabsContent value="overview" className="space-y-6">
        <OverviewTab stats={stats} commissions={commissions} />
      </TabsContent>
      <TabsContent value="links" className="space-y-6">
        <LinksTab links={affiliateLinks} onCreateLink={onCreateLink} onCopyLink={onCopyLink} />
      </TabsContent>
      <TabsContent value="referrals" className="space-y-6">
        <ReferralsTab referrals={referrals} filterStatus={filterStatus} onFilterChange={onFilterChange} />
      </TabsContent>
      <TabsContent value="commissions" className="space-y-6">
        <CommissionsTab commissions={commissions} />
      </TabsContent>
      <TabsContent value="tools" className="space-y-6">
        <ToolsTab />
      </TabsContent>
      <TabsContent value="settings" className="space-y-6">
        <SettingsTab stats={stats} minPayoutThreshold={minPayoutThreshold} />
      </TabsContent>
      <TabsContent value="ai-ml" className="space-y-6">
        <AiMlTab />
      </TabsContent>
      <TabsContent value="collaboration" className="space-y-6">
        <CollaborationTab />
      </TabsContent>
      <TabsContent value="performance" className="space-y-6">
        <PerformanceTab />
      </TabsContent>
      <TabsContent value="security" className="space-y-6">
        <SecurityTab />
      </TabsContent>
      <TabsContent value="i18n" className="space-y-6">
        <I18nTab />
      </TabsContent>
      <TabsContent value="accessibility" className="space-y-6">
        <AccessibilityTab />
      </TabsContent>
      <TabsContent value="workflow" className="space-y-6">
        <WorkflowTab />
      </TabsContent>
    </>
  );
}
