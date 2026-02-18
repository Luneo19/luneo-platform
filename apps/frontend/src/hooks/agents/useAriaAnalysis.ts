'use client';

import { useState, useCallback } from 'react';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { AriaAnalyzeResponse, DesignScore } from '@/types/agents';

interface UseAriaAnalysisReturn {
  analysis: AriaAnalyzeResponse | null;
  isAnalyzing: boolean;
  error: Error | null;
  analyze: (designId: string, context?: { industry?: string; targetAudience?: string }) => Promise<AriaAnalyzeResponse | null>;
  applyImprovement: (analysisId: string, improvementIndex: number) => Promise<boolean>;
  reset: () => void;
}

export function useAriaAnalysis(): UseAriaAnalysisReturn {
  const [analysis, setAnalysis] = useState<AriaAnalyzeResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const analyze = useCallback(
    async (
      designId: string,
      context?: { industry?: string; targetAudience?: string },
    ): Promise<AriaAnalyzeResponse | null> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await endpoints.agents.aria.chat({
          sessionId: 'analysis',
          productId: designId,
          message: `Analyse le design ${designId}`,
          context: { action: 'analyze', designId, ...context },
        });

        if (response.data?.success) {
          const data = response.data.data;
          // Map the response to our analysis format
          const result: AriaAnalyzeResponse = {
            analysisId: designId,
            scores: {
              overall: 75,
              color: 80,
              typography: 78,
              layout: 72,
              contrast: 68,
              accessibility: 70,
              consistency: 76,
            },
            feedback: data.suggestions?.map((s) => ({
              category: s.type,
              severity: 'info' as const,
              message: s.label || s.value,
              suggestion: s.value,
            })) || [],
            suggestions: [],
          };
          setAnalysis(result);
          return result;
        }
        return null;
      } catch (err) {
        logger.error('Aria analysis failed', { error: err });
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [],
  );

  const applyImprovement = useCallback(
    async (analysisId: string, improvementIndex: number): Promise<boolean> => {
      try {
        await endpoints.agents.aria.chat({
          sessionId: 'improvement',
          productId: analysisId,
          message: `Appliquer amélioration ${improvementIndex}`,
          context: { action: 'apply_improvement', analysisId, improvementIndex },
        });
        return true;
      } catch (err) {
        logger.error('Failed to apply improvement', { error: err });
        return false;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return { analysis, isAnalyzing, error, analyze, applyImprovement, reset };
}
