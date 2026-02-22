/**
 * Client Component pour AI Studio
 * Version professionnelle améliorée
 */

'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { useToast } from '@/hooks/use-toast';
import { useCredits } from '@/hooks/useCredits';
import { AIStudioHeader } from './components/AIStudioHeader';
import { AIStats } from './components/AIStats';
import { AIGenerationsGrid } from './components/AIGenerationsGrid';
import { GenerateModal } from './components/modals/GenerateModal';
import { useAIGenerations } from './hooks/useAIGenerations';
import { useAIGenerate } from './hooks/useAIGenerate';
import { Button } from '@/components/ui/button';
import { PlanGate } from '@/lib/hooks/api/useFeatureGate';
import { UpgradeRequiredPage } from '@/components/shared/UpgradeRequiredPage';
import type { GenerationType, AISettings } from './types';

export function AIStudioPageClient() {
  const { t } = useI18n();
  return (
    <PlanGate
      minimumPlan="professional"
      showUpgradePrompt
      fallback={
        <UpgradeRequiredPage
          feature="AI Studio"
          requiredPlan="professional"
          description="AI Studio est disponible à partir du plan Professional."
        />
      }
    >
      <AIStudioPageContent />
    </PlanGate>
  );
}

function AIStudioPageContent() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<GenerationType>('2d');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const { generations, stats, isLoading, error, refetch, deleteGeneration } = useAIGenerations(
    activeTab,
    searchTerm,
    filterStatus
  );

  const { generate, isGenerating, progress } = useAIGenerate();

  const handleGenerate = async (
    prompt: string,
    type: GenerationType,
    settings: AISettings
  ) => {
    const result = await generate({
      prompt,
      type: type as '2d' | '3d' | 'animation' | 'template',
      ...settings,
    });

    if (result.success) {
      setTimeout(() => {
        refetch();
      }, 2000);
    }

    return result;
  };

  const handlePreview = (generation: { id: string; result?: string }) => {
    if (generation.result) {
      window.open(generation.result, '_blank');
    }
  };

  const handleDownload = (generation: { id: string; result?: string }) => {
    if (generation.result) {
      const link = document.createElement('a');
      link.href = generation.result;
      link.download = `ai-design-${generation.id}.png`;
      link.click();
    }
  };

  const handleShare = (generation: { id: string; result?: string }) => {
    if (generation.result) {
      navigator.clipboard.writeText(generation.result);
      toast({
        title: t('aiStudio.linkCopied'),
        description: t('aiStudio.linkCopiedDesc'),
      });
    }
  };

  const handleDelete = async (generationId: string) => {
    if (confirm(t('aiStudio.deleteConfirmGeneration'))) {
      await deleteGeneration(generationId);
    }
  };

  // Get credits from user profile
  const { credits: creditsData } = useCredits();
  const credits = creditsData?.balance || 0;

  if (error) {
    return (
      <div className="space-y-6 pb-10 flex flex-col items-center justify-center min-h-[40vh]">
        <p className="text-red-400 mb-4">{t('aiStudio.loadError')}</p>
        <Button variant="outline" onClick={() => refetch()} className="border-white/20">
          {t('aiStudio.retry')}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="dash-card h-16 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="dash-card h-24 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <AIStudioHeader onGenerate={() => setShowGenerateModal(true)} credits={credits} />
      <AIStats {...stats} />
      <AIGenerationsGrid
        generations={generations}
        onPreview={handlePreview}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onShare={handleShare}
      />

      <GenerateModal
        open={showGenerateModal}
        onOpenChange={setShowGenerateModal}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        progress={progress}
        defaultType={activeTab}
      />
    </div>
  );
}

