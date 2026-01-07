/**
 * Client Component pour AI Studio Animations
 * Version professionnelle simplifiée
 */

'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AnimationsHeader } from './components/AnimationsHeader';
import { AnimationsStats } from './components/AnimationsStats';
import { AnimationsGrid } from './components/AnimationsGrid';
import { GenerateModal } from './components/modals/GenerateModal';
import { useAnimations } from './hooks/useAnimations';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Video } from 'lucide-react';
import type { GeneratedAnimation } from './types';

export function AIStudioAnimationsPageClient() {
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
    style: any,
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
      title: 'Détails',
      description: `Ouverture des détails de "${animation.prompt}"`,
    });
  };

  const handlePlay = (animation: GeneratedAnimation) => {
    if (animation.url) {
      window.open(animation.url, '_blank');
    } else {
      toast({
        title: 'Erreur',
        description: 'URL de l\'animation non disponible',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFavorite = async (animationId: string) => {
    await toggleFavorite(animationId);
  };

  const handleDelete = async (animationId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette animation ?')) {
      await deleteAnimation(animationId);
    }
  };

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
      <AnimationsHeader onGenerate={() => setShowGenerateModal(true)} />
      <AnimationsStats {...stats} />

      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher une animation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-900 border-gray-600 text-white pl-10"
              />
            </div>
          </div>
          <Select value={filterStyle} onValueChange={setFilterStyle}>
            <SelectTrigger className="w-48 bg-gray-900 border-gray-600 text-white">
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
            <SelectTrigger className="w-48 bg-gray-900 border-gray-600 text-white">
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
        <div className="mt-3 text-sm text-gray-400">
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

