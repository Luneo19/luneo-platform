/**
 * Hook personnalisé pour générer des designs AI
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { AISettings } from '../types';

interface GenerateOptions extends AISettings {
  prompt: string;
  type: '2d' | '3d' | 'animation' | 'template';
}

export function useAIGenerate() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generate = useCallback(
    async (options: GenerateOptions): Promise<{ success: boolean; error?: string; generationId?: string }> => {
      setIsGenerating(true);
      setProgress(0);

      try {
        setProgress(50);
        const data = await endpoints.ai.generate({
          prompt: options.prompt,
          productId: '',
          options: {
            model: options.model,
            size: options.size,
            quality: options.quality,
            style: options.style,
            type: options.type,
          },
        });

        setProgress(100);
        setTimeout(() => setProgress(0), 500);

        toast({
          title: t('common.success'),
          description: t('aiStudio.generationInProgress'),
        });

        const generationId = (data as { designId?: string; data?: { id?: string }; generationId?: string; id?: string }).designId
          ?? (data as { data?: { id?: string } }).data?.id
          ?? (data as { generationId?: string }).generationId
          ?? (data as { id?: string }).id;
        return {
          success: true,
          generationId,
        };
      } catch (error: unknown) {
        logger.error('AI generation error', { error, options });
        const errorMessage =
          error instanceof Error ? error.message : t('aiStudio.generationFailed');
        toast({
          title: t('common.error'),
          description: errorMessage,
          variant: 'destructive',
        });
        return { success: false, error: errorMessage };
      } finally {
        setIsGenerating(false);
      }
    },
    [toast, t]
  );

  return {
    generate,
    isGenerating,
    progress,
  };
}



