/**
 * Client Component pour AI Studio Animations
 * Version professionnelle simplifiée
 */

'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { useToast } from '@/hooks/use-toast';
import { AnimationsHeader } from './components/AnimationsHeader';
import { AnimationsStats } from './components/AnimationsStats';
import { AnimationsGrid } from './components/AnimationsGrid';
import { GenerateModal } from './components/modals/GenerateModal';
import { useAnimations } from './hooks/useAnimations';
import type { AnimationStyle } from './types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Video } from 'lucide-react';
import type { GeneratedAnimation } from './types';

export function AIStudioAnimationsPageClient() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStyle, setFilterStyle] = useState<string>('all');
  const [filterDuration, setFilterDuration] = useState<string>('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedAnimation, setSelectedAnimation] = useState<GeneratedAnimation | null>(null);

  const {
    animations,
    stats,
    isLoading,
    isGenerating,
    generationProgress,
    generateAnimation,
    toggleFavorite,
    deleteAnimation,
  } = useAnimations(searchTerm, filterStyle, filterDuration);

  const handleGenerate = async (
    prompt: string,
    duration: number,
    style: AnimationStyle,
    fps: number,
    resolution: string
  ) => {
    const result = await generateAnimation(prompt, duration, style, fps, resolution);
    if (result.success) {
      setShowGenerateModal(false);
    }
  };

  const handleView = (animation: GeneratedAnimation) => {
    setSelectedAnimation(animation);
    toast({
      title: t('aiStudio.details'),
      description: `"${animation.prompt}"`,
    });
  };

  const handlePlay = (animation: GeneratedAnimation) => {
    if (animation.url) {
      window.open(animation.url, '_blank');
    } else {
      toast({
        title: t('common.error'),
        description: t('aiStudio.generationError'),
        variant: 'destructive',
      });
    }
  };

  const handleToggleFavorite = async (animationId: string) => {
    await toggleFavorite(animationId);
  };

  const handleDelete = async (animationId: string) => {
    if (confirm(t('aiStudio.deleteConfirmGeneration'))) {
      await deleteAnimation(animationId);
    }
  };

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
      <AnimationsHeader onGenerate={() => setShowGenerateModal(true)} />
      <AnimationsStats {...stats} />

      <Card className="dash-card p-4 border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Rechercher une animation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="dash-input pl-10 border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/40"
              />
            </div>
          </div>
          <Select value={filterStyle} onValueChange={setFilterStyle}>
            <SelectTrigger className="dash-input w-48 border-white/[0.08] bg-white/[0.04] text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les styles</SelectItem>
              <SelectItem value="smooth">Fluide</SelectItem>
              <SelectItem value="bounce">Rebond</SelectItem>
              <SelectItem value="fade">Fondu</SelectItem>
              <SelectItem value="slide">Glissement</SelectItem>
              <SelectItem value="zoom">Zoom</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDuration} onValueChange={setFilterDuration}>
            <SelectTrigger className="dash-input w-48 border-white/[0.08] bg-white/[0.04] text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Durée" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les durées</SelectItem>
              <SelectItem value="short">Court (≤5s)</SelectItem>
              <SelectItem value="medium">Moyen (5-10s)</SelectItem>
              <SelectItem value="long">Long (&gt;10s)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 text-sm text-white/40">
          {animations.length} animation{animations.length > 1 ? 's' : ''} trouvée{animations.length > 1 ? 's' : ''}
        </div>
      </Card>

      <AnimationsGrid
        animations={animations}
        onView={handleView}
        onPlay={handlePlay}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDelete}
      />

      <GenerateModal
        open={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        progress={generationProgress}
      />
    </div>
  );
}

