'use client';

import { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  ExportDialog,
  FloatingPanels,
  GenerateTab,
  HeaderSection,
  HistoryTab,
  ModelDetailDialog,
  PlaceholderTab,
  PreviewDialog,
  StatsCards,
  StudioTabList,
  TemplatesTab,
} from './components';
import { useAIStudio3DPageState } from './hooks/useAIStudio3DPageState';

const PLACEHOLDER_TABS = [
  { value: 'analytics' as const, title: 'Analytics', desc: 'Statistiques et graphiques' },
  { value: 'ai-ml' as const, title: 'IA/ML', desc: 'Modèles et recommandations' },
  { value: 'collaboration' as const, title: 'Collaboration', desc: 'Travail en équipe' },
  { value: 'performance' as const, title: 'Performance', desc: 'Optimisation et cache' },
  { value: 'security' as const, title: 'Sécurité', desc: 'Politiques et conformité' },
  { value: 'i18n' as const, title: 'i18n', desc: 'Langues et formats' },
  { value: 'accessibility' as const, title: 'Accessibilité', desc: "WCAG et lecteurs d'écran" },
  { value: 'workflow' as const, title: 'Workflow', desc: 'Automatisation' },
];

function AIStudio3DPageContent() {
  const s = useAIStudio3DPageState();
  return (
    <div className="space-y-6 pb-10">
      <HeaderSection credits={s.credits} />
      <StatsCards stats={s.stats} />
      <Tabs value={s.activeTab} onValueChange={(v) => s.setActiveTab(v as typeof s.activeTab)} className="space-y-6">
        <StudioTabList />
        <TabsContent value="generate" className="space-y-6"><GenerateTab {...s.generateTabProps} /></TabsContent>
        <TabsContent value="history" className="space-y-6"><HistoryTab {...s.historyTabProps} /></TabsContent>
        <TabsContent value="templates" className="space-y-6"><TemplatesTab {...s.templatesTabProps} /></TabsContent>
        {PLACEHOLDER_TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="space-y-6">
            <PlaceholderTab title={t.title} description={t.desc} />
          </TabsContent>
        ))}
      </Tabs>
      <ModelDetailDialog open={s.showDetailDialog} onOpenChange={s.setShowDetailDialog} model={s.selectedModel} onExportClick={s.openExportDialog} />
      <PreviewDialog open={s.showPreviewDialog} onOpenChange={s.setShowPreviewDialog} model={s.selectedModel} onExportClick={s.openExportDialog} />
      <ExportDialog open={s.showExportDialog} onOpenChange={s.setShowExportDialog} onExportConfirm={s.toast} />
      <FloatingPanels credits={s.credits} />
    </div>
  );
}

const MemoizedContent = memo(AIStudio3DPageContent);

export default function AIStudio3DPage() {
  return (
    <ErrorBoundary componentName="AIStudio3D">
      <MemoizedContent />
    </ErrorBoundary>
  );
}
