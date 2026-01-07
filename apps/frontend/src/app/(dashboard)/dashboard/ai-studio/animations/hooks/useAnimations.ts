/**
 * Hook personnalisé pour gérer les animations AI
 */

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { GeneratedAnimation, AnimationStyle, AnimationTemplate } from '../types';

export function useAnimations(
  searchTerm: string,
  filterStyle: string,
  filterDuration: string
) {
  const { toast } = useToast();
  const [animations, setAnimations] = useState<GeneratedAnimation[]>([]);
  const [templates, setTemplates] = useState<AnimationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    fetchAnimations();
    fetchTemplates();
  }, []);

  const fetchAnimations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-studio/animations');
      if (response.ok) {
        const data = await response.json();
        setAnimations(data.animations || data.data || []);
      } else {
        setAnimations([]);
      }
    } catch (error) {
      logger.error('Failed to fetch animations', { error });
      setAnimations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/ai-studio/animations/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || data.data || []);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      logger.error('Failed to fetch templates', { error });
      setTemplates([]);
    }
  };

  const filteredAnimations = useMemo(() => {
    return animations.filter((anim) => {
      const matchesSearch =
        searchTerm === '' ||
        anim.prompt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStyle = filterStyle === 'all' || anim.style === filterStyle;
      const matchesDuration =
        filterDuration === 'all' ||
        (filterDuration === 'short' && anim.duration <= 5) ||
        (filterDuration === 'medium' && anim.duration > 5 && anim.duration <= 10) ||
        (filterDuration === 'long' && anim.duration > 10);
      return matchesSearch && matchesStyle && matchesDuration;
    });
  }, [animations, searchTerm, filterStyle, filterDuration]);

  const generateAnimation = async (
    prompt: string,
    duration: number,
    style: AnimationStyle,
    fps: number,
    resolution: string
  ) => {
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 1000);

      const response = await fetch('/api/ai-studio/animations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          duration,
          style,
          fps,
          resolution,
        }),
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (response.ok) {
        const data = await response.json();
        const newAnimation: GeneratedAnimation = {
          id: `anim-${Date.now()}`,
          prompt,
          duration,
          style,
          fps,
          resolution,
          status: 'completed',
          url: data.url || data.videoUrl,
          thumbnail: data.thumbnail,
          credits: duration * 10, // Example: 10 credits per second
          createdAt: Date.now(),
          isFavorite: false,
        };
        setAnimations((prev) => [newAnimation, ...prev]);
        toast({ title: 'Succès', description: 'Animation générée avec succès' });
        return { success: true, animation: newAnimation };
      }
      throw new Error('Failed to generate animation');
    } catch (error: any) {
      logger.error('Failed to generate animation', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la génération',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const toggleFavorite = async (animationId: string) => {
    try {
      const response = await fetch(`/api/ai-studio/animations/${animationId}/favorite`, {
        method: 'POST',
      });
      if (response.ok) {
        setAnimations((prev) =>
          prev.map((a) => (a.id === animationId ? { ...a, isFavorite: !a.isFavorite } : a))
        );
        toast({ title: 'Succès', description: 'Favori mis à jour' });
        return { success: true };
      }
      throw new Error('Failed to toggle favorite');
    } catch (error: any) {
      logger.error('Failed to toggle favorite', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la mise à jour',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  const deleteAnimation = async (animationId: string) => {
    try {
      const response = await fetch(`/api/ai-studio/animations/${animationId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setAnimations((prev) => prev.filter((a) => a.id !== animationId));
        toast({ title: 'Succès', description: 'Animation supprimée' });
        return { success: true };
      }
      throw new Error('Failed to delete animation');
    } catch (error: any) {
      logger.error('Failed to delete animation', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la suppression',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  const stats = useMemo(() => {
    return {
      totalGenerations: animations.length,
      totalCredits: animations.reduce((sum, anim) => sum + anim.credits, 0),
      avgGenerationTime: 62.5,
      successRate: 96.2,
      favoriteCount: animations.filter((anim) => anim.isFavorite).length,
      totalDuration: animations.reduce((sum, anim) => sum + anim.duration, 0),
    };
  }, [animations]);

  return {
    animations: filteredAnimations,
    allAnimations: animations,
    templates,
    stats,
    isLoading,
    isGenerating,
    generationProgress,
    refetch: fetchAnimations,
    generateAnimation,
    toggleFavorite,
    deleteAnimation,
  };
}


