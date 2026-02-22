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
  PreviewDialog,
  StatsCards,
  StudioTabList,
  TemplatesTab,
} from './components';
import { useAIStudio3DPageState } from './hooks/useAIStudio3DPageState';

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
      </Tabs>
      <ModelDetailDialog open={s.showDetailDialog} onOpenChange={s.setShowDetailDialog} model={s.selectedModel} onExportClick={s.openExportDialog} />
      <PreviewDialog open={s.showPreviewDialog} onOpenChange={s.setShowPreviewDialog} model={s.selectedModel} onExportClick={s.openExportDialog} />
      <ExportDialog
        open={s.showExportDialog}
        onOpenChange={s.setShowExportDialog}
        onExportConfirm={s.toast}
        modelId={s.selectedModel?.id}
        modelUrl={s.selectedModel?.modelUrl || s.selectedModel?.thumbnailUrl}
      />
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
