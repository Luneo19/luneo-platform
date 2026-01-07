/**
 * Client Component pour AI Studio
 * Version professionnelle améliorée
 */

'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AIStudioHeader } from './components/AIStudioHeader';
import { AIStats } from './components/AIStats';
import { AIGenerationsGrid } from './components/AIGenerationsGrid';
import { GenerateModal } from './components/modals/GenerateModal';
import { useAIGenerations } from './hooks/useAIGenerations';
import { useAIGenerate } from './hooks/useAIGenerate';
import type { GenerationType, AISettings } from './types';

export function AIStudioPageClient() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<GenerationType>('2d');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const { generations, stats, isLoading, deleteGeneration, refetch } = useAIGenerations(
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
      type,
      ...settings,
    });

    if (result.success) {
      setTimeout(() => {
        refetch();
      }, 2000);
    }

    return result;
  };

  const handlePreview = (generation: any) => {
    if (generation.result) {
      window.open(generation.result, '_blank');
    }
  };

  const handleDownload = (generation: any) => {
    if (generation.result) {
      const link = document.createElement('a');
      link.href = generation.result;
      link.download = `ai-design-${generation.id}.png`;
      link.click();
    }
  };

  const handleShare = (generation: any) => {
    if (generation.result) {
      navigator.clipboard.writeText(generation.result);
      toast({
        title: 'Lien copié',
        description: 'Lien de l\'image copié dans le presse-papiers',
      });
    }
  };

  const handleDelete = async (generationId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette génération ?')) {
      await deleteGeneration(generationId);
    }
  };

  // TODO: Get credits from user profile
  const credits = undefined;

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-16 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-gray-800 rounded animate-pulse" />
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

