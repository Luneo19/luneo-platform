/**
 * useAI Hook
 * Hook React pour les opérations IA
 */

'use client';

import { useState, useCallback } from 'react';
import { aiService } from './AIService';
import type {
  AIOperation,
  BackgroundRemovalRequest,
  UpscaleRequest,
  ColorExtractionRequest,
  TextToDesignRequest,
  SmartCropRequest,
  AIHistoryItem,
  AIQuota,
} from './types';

interface UseAIState {
  isProcessing: boolean;
  currentOperation: AIOperation | null;
  progress: number;
  error: string | null;
}

export function useAI() {
  const [state, setState] = useState<UseAIState>({
    isProcessing: false,
    currentOperation: null,
    progress: 0,
    error: null,
  });

  const startOperation = useCallback((operation: AIOperation) => {
    setState({
      isProcessing: true,
      currentOperation: operation,
      progress: 0,
      error: null,
    });
  }, []);

  const endOperation = useCallback((error?: string) => {
    setState((prev) => ({
      ...prev,
      isProcessing: false,
      currentOperation: null,
      progress: 100,
      error: error || null,
    }));
  }, []);

  /**
   * Remove background
   */
  const removeBackground = useCallback(
    async (
      imageUrl: string,
      mode: 'auto' | 'person' | 'product' | 'animal' = 'auto'
    ): Promise<BackgroundRemovalRequest | null> => {
      startOperation('background_removal');

      try {
        const result = await aiService.removeBackground(imageUrl, mode);
        endOperation();
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove background';
        endOperation(message);
        return null;
      }
    },
    [startOperation, endOperation]
  );

  /**
   * Upscale image
   */
  const upscaleImage = useCallback(
    async (
      imageUrl: string,
      scale: 2 | 4 = 2,
      options?: { enhanceDetails?: boolean; denoiseStrength?: number }
    ): Promise<UpscaleRequest | null> => {
      startOperation('upscale');

      try {
        const result = await aiService.upscaleImage(imageUrl, scale, options);
        endOperation();
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to upscale image';
        endOperation(message);
        return null;
      }
    },
    [startOperation, endOperation]
  );

  /**
   * Extract colors
   */
  const extractColors = useCallback(
    async (
      imageUrl: string,
      maxColors: number = 6,
      includeNeutral: boolean = false
    ): Promise<ColorExtractionRequest | null> => {
      startOperation('color_extraction');

      try {
        const result = await aiService.extractColors(imageUrl, maxColors, includeNeutral);
        endOperation();
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to extract colors';
        endOperation(message);
        return null;
      }
    },
    [startOperation, endOperation]
  );

  /**
   * Text to design
   */
  const generateDesign = useCallback(
    async (
      prompt: string,
      options?: {
        style?: 'modern' | 'vintage' | 'minimal' | 'bold' | 'playful';
        aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
        colorScheme?: string[];
        negativePrompt?: string;
      }
    ): Promise<TextToDesignRequest | null> => {
      startOperation('text_to_design');

      try {
        const result = await aiService.textToDesign(prompt, options);
        endOperation();
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate design';
        endOperation(message);
        return null;
      }
    },
    [startOperation, endOperation]
  );

  /**
   * Smart crop
   */
  const smartCrop = useCallback(
    async (
      imageUrl: string,
      targetAspectRatio: string,
      focusPoint?: 'auto' | 'face' | 'center' | 'product'
    ): Promise<SmartCropRequest | null> => {
      startOperation('smart_crop');

      try {
        const result = await aiService.smartCrop(imageUrl, targetAspectRatio, focusPoint);
        endOperation();
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to crop image';
        endOperation(message);
        return null;
      }
    },
    [startOperation, endOperation]
  );

  /**
   * Get history
   */
  const getHistory = useCallback((): AIHistoryItem[] => {
    return aiService.getHistory();
  }, []);

  /**
   * Get quota
   */
  const getQuota = useCallback(async (): Promise<AIQuota> => {
    return aiService.getQuota();
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    isProcessing: state.isProcessing,
    currentOperation: state.currentOperation,
    progress: state.progress,
    error: state.error,

    // Operations
    removeBackground,
    upscaleImage,
    extractColors,
    generateDesign,
    smartCrop,

    // Utils
    getHistory,
    getQuota,
    clearError,
  };
}

export default useAI;


