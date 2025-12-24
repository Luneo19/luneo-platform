/**
 * AI Service
 * AI-002 à AI-006: Service centralisé pour les opérations IA
 * 
 * Fonctionnalités:
 * - Background removal (AI-002)
 * - Image upscaling (AI-003)
 * - Color extraction (AI-005)
 * - Text-to-design (AI-006)
 * - Smart crop (AI-004)
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import type {
  AIOperation,
  AIOperationStatus,
  BackgroundRemovalRequest,
  UpscaleRequest,
  ColorExtractionRequest,
  TextToDesignRequest,
  SmartCropRequest,
  ExtractedColor,
  AIHistoryItem,
  AIQuota,
} from './types';

class AIService {
  private static instance: AIService;
  private history: AIHistoryItem[] = [];
  private readonly MAX_HISTORY = 50;

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Remove background from image
   * AI-002: Background Removal automatique
   */
  async removeBackground(
    imageUrl: string,
    mode: 'auto' | 'person' | 'product' | 'animal' = 'auto'
  ): Promise<BackgroundRemovalRequest> {
    const request: BackgroundRemovalRequest = {
      id: uuidv4(),
      operation: 'background_removal',
      status: 'processing',
      createdAt: Date.now(),
      input: { imageUrl, mode },
    };

    this.addToHistory(request);

    try {
      const response = await fetch('/api/ai/background-removal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, mode }),
      });

      if (!response.ok) {
        throw new Error('Background removal failed');
      }

      const result = await response.json();

      request.status = 'completed';
      request.completedAt = Date.now();
      request.output = {
        imageUrl: result.outputUrl,
        maskUrl: result.maskUrl,
      };

      this.updateHistory(request);
      logger.info('Background removal completed', { id: request.id });

      return request;
    } catch (error) {
      request.status = 'failed';
      request.error = error instanceof Error ? error.message : 'Unknown error';
      this.updateHistory(request);
      throw error;
    }
  }

  /**
   * Upscale image
   * AI-003: Image Upscaling IA
   */
  async upscaleImage(
    imageUrl: string,
    scale: 2 | 4 = 2,
    options: { enhanceDetails?: boolean; denoiseStrength?: number } = {}
  ): Promise<UpscaleRequest> {
    const request: UpscaleRequest = {
      id: uuidv4(),
      operation: 'upscale',
      status: 'processing',
      createdAt: Date.now(),
      input: {
        imageUrl,
        scale,
        enhanceDetails: options.enhanceDetails ?? true,
        denoiseStrength: options.denoiseStrength ?? 0.3,
      },
    };

    this.addToHistory(request);

    try {
      const response = await fetch('/api/ai/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.input),
      });

      if (!response.ok) {
        throw new Error('Image upscaling failed');
      }

      const result = await response.json();

      request.status = 'completed';
      request.completedAt = Date.now();
      request.output = {
        imageUrl: result.outputUrl,
        originalSize: result.originalSize,
        newSize: result.newSize,
      };

      this.updateHistory(request);
      logger.info('Image upscaling completed', { id: request.id, scale });

      return request;
    } catch (error) {
      request.status = 'failed';
      request.error = error instanceof Error ? error.message : 'Unknown error';
      this.updateHistory(request);
      throw error;
    }
  }

  /**
   * Extract colors from image
   * AI-005: Color palette extraction
   */
  async extractColors(
    imageUrl: string,
    maxColors: number = 6,
    includeNeutral: boolean = false
  ): Promise<ColorExtractionRequest> {
    const request: ColorExtractionRequest = {
      id: uuidv4(),
      operation: 'color_extraction',
      status: 'processing',
      createdAt: Date.now(),
      input: { imageUrl, maxColors, includeNeutral },
    };

    this.addToHistory(request);

    try {
      const response = await fetch('/api/ai/extract-colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.input),
      });

      if (!response.ok) {
        throw new Error('Color extraction failed');
      }

      const result = await response.json();

      request.status = 'completed';
      request.completedAt = Date.now();
      request.output = {
        colors: result.colors,
        dominantColor: result.dominantColor,
        palette: result.palette,
      };

      this.updateHistory(request);
      logger.info('Color extraction completed', { id: request.id, colorsFound: result.colors.length });

      return request;
    } catch (error) {
      request.status = 'failed';
      request.error = error instanceof Error ? error.message : 'Unknown error';
      this.updateHistory(request);
      throw error;
    }
  }

  /**
   * Generate design from text
   * AI-006: Text-to-Design
   */
  async textToDesign(
    prompt: string,
    options: {
      style?: 'modern' | 'vintage' | 'minimal' | 'bold' | 'playful';
      aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
      colorScheme?: string[];
      negativePrompt?: string;
    } = {}
  ): Promise<TextToDesignRequest> {
    const request: TextToDesignRequest = {
      id: uuidv4(),
      operation: 'text_to_design',
      status: 'processing',
      createdAt: Date.now(),
      input: {
        prompt,
        style: options.style || 'modern',
        aspectRatio: options.aspectRatio || '1:1',
        colorScheme: options.colorScheme,
        negativePrompt: options.negativePrompt,
      },
    };

    this.addToHistory(request);

    try {
      const response = await fetch('/api/ai/text-to-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.input),
      });

      if (!response.ok) {
        throw new Error('Design generation failed');
      }

      const result = await response.json();

      request.status = 'completed';
      request.completedAt = Date.now();
      request.output = {
        imageUrl: result.imageUrl,
        variations: result.variations,
        metadata: result.metadata,
      };

      this.updateHistory(request);
      logger.info('Text-to-design completed', { id: request.id });

      return request;
    } catch (error) {
      request.status = 'failed';
      request.error = error instanceof Error ? error.message : 'Unknown error';
      this.updateHistory(request);
      throw error;
    }
  }

  /**
   * Smart crop image
   * AI-004: Smart Crop intelligent
   */
  async smartCrop(
    imageUrl: string,
    targetAspectRatio: string,
    focusPoint: 'auto' | 'face' | 'center' | 'product' = 'auto'
  ): Promise<SmartCropRequest> {
    const request: SmartCropRequest = {
      id: uuidv4(),
      operation: 'smart_crop',
      status: 'processing',
      createdAt: Date.now(),
      input: { imageUrl, targetAspectRatio, focusPoint },
    };

    this.addToHistory(request);

    try {
      const response = await fetch('/api/ai/smart-crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.input),
      });

      if (!response.ok) {
        throw new Error('Smart crop failed');
      }

      const result = await response.json();

      request.status = 'completed';
      request.completedAt = Date.now();
      request.output = {
        imageUrl: result.outputUrl,
        cropArea: result.cropArea,
        detectedSubjects: result.detectedSubjects,
      };

      this.updateHistory(request);
      logger.info('Smart crop completed', { id: request.id });

      return request;
    } catch (error) {
      request.status = 'failed';
      request.error = error instanceof Error ? error.message : 'Unknown error';
      this.updateHistory(request);
      throw error;
    }
  }

  /**
   * Get operation history
   */
  getHistory(): AIHistoryItem[] {
    return [...this.history];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Get quota
   */
  async getQuota(): Promise<AIQuota> {
    try {
      const response = await fetch('/api/ai/quota');
      if (!response.ok) {
        throw new Error('Failed to fetch quota');
      }
      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch AI quota', { error });
      // Return default quota on error
      return {
        used: 0,
        limit: 100,
        resetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        operations: {
          background_removal: { used: 0, limit: 50 },
          upscale: { used: 0, limit: 30 },
          color_extraction: { used: 0, limit: 100 },
          style_transfer: { used: 0, limit: 20 },
          text_to_design: { used: 0, limit: 20 },
          smart_crop: { used: 0, limit: 50 },
          enhance: { used: 0, limit: 50 },
          colorize: { used: 0, limit: 30 },
        },
      };
    }
  }

  // Private helpers
  private addToHistory(request: any): void {
    const historyItem: AIHistoryItem = {
      id: request.id,
      operation: request.operation,
      timestamp: request.createdAt,
      inputPreview: request.input?.imageUrl,
      status: request.status,
    };

    this.history.unshift(historyItem);
    if (this.history.length > this.MAX_HISTORY) {
      this.history.pop();
    }
  }

  private updateHistory(request: any): void {
    const index = this.history.findIndex((h) => h.id === request.id);
    if (index !== -1) {
      this.history[index] = {
        ...this.history[index],
        status: request.status,
        outputPreview: request.output?.imageUrl,
      };
    }
  }
}

export const aiService = AIService.getInstance();
export default AIService;


