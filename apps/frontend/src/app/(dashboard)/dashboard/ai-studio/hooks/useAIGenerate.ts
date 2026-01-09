/**
 * Hook personnalisé pour générer des designs AI
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { AISettings } from '../types';

interface GenerateOptions extends AISettings {
  prompt: string;
  type: '2d' | '3d' | 'animation';
}

export function useAIGenerate() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generate = useCallback(
    async (options: GenerateOptions): Promise<{ success: boolean; error?: string; generationId?: string }> => {
      setIsGenerating(true);
      setProgress(0);

      try {
        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: options.prompt,
            model: options.model,
            size: options.size,
            quality: options.quality,
            style: options.style,
            type: options.type,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
          throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
        }

        setProgress(50);
        const data = await response.json();

        setProgress(100);
        setTimeout(() => setProgress(0), 500);

        toast({
          title: 'Succès',
          description: 'Génération en cours...',
        });

        return {
          success: true,
          generationId: data.data?.id || data.generationId || data.id,
        };
      } catch (error: any) {
        logger.error('AI generation error', { error, options });
        const errorMessage =
          error.message || 'Erreur lors de la génération. Réessayez.';
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
        return { success: false, error: errorMessage };
      } finally {
        setIsGenerating(false);
      }
    },
    [toast]
  );

  return {
    generate,
    isGenerating,
    progress,
  };
}



