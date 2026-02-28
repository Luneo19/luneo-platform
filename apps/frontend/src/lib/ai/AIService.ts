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
import { api } from '@/lib/api/client';
import type {
  AIRequest,
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
      const result = await api.post<{ outputUrl?: string; url?: string; maskUrl?: string }>(
        '/api/v1/ai/background-removal',
        { imageUrl, mode }
      );
      const outputUrl = result.outputUrl ?? result.url;

      request.status = 'completed';
      request.completedAt = Date.now();
      request.output = {
        imageUrl: outputUrl ?? '',
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
      const result = await api.post<{
        outputUrl?: string;
        url?: string;
        originalSize?: { width: number; height: number };
        newSize?: { width: number; height: number };
      }>('/api/v1/ai/upscale', request.input);

      request.status = 'completed';
      request.completedAt = Date.now();
      request.output = {
        imageUrl: result.outputUrl ?? result.url ?? '',
        originalSize: result.originalSize ?? { width: 0, height: 0 },
        newSize: result.newSize ?? { width: 0, height: 0 },
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
      const result = await api.post<{
        colors?: ExtractedColor[];
        dominantColor?: string;
        palette?: string[];
      }>('/api/v1/ai/extract-colors', request.input);

      request.status = 'completed';
      request.completedAt = Date.now();
      request.output = {
        colors: result.colors ?? [],
        dominantColor: result.dominantColor ?? '',
        palette: result.palette ?? [],
      };

      this.updateHistory(request);
      logger.info('Color extraction completed', { id: request.id, colorsFound: result.colors?.length ?? 0 });

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
      const result = await api.post<{
        imageUrl?: string;
        variations?: string[];
        metadata?: Record<string, unknown>;
      }>('/api/v1/ai/text-to-design', request.input);

      request.status = 'completed';
      request.completedAt = Date.now();
      request.output = {
        imageUrl: result.imageUrl ?? '',
        variations: result.variations ?? [],
        metadata: (result.metadata ?? { model: '', seed: 0, steps: 0 }) as { model: string; seed: number; steps: number },
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
      const result = await api.post<{
        outputUrl?: string;
        url?: string;
        cropArea?: unknown;
        detectedSubjects?: unknown;
      }>('/api/v1/ai/smart-crop', request.input);
      const outputUrl = result.outputUrl ?? result.url ?? '';

      request.status = 'completed';
      request.completedAt = Date.now();
      request.output = {
        imageUrl: outputUrl,
        cropArea: (result.cropArea ?? { x: 0, y: 0, width: 0, height: 0 }) as { x: number; y: number; width: number; height: number },
        detectedSubjects: (result.detectedSubjects ?? []) as { type: string; bbox: number[] }[],
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
      return await api.get<AIQuota>('/api/v1/ai/quota');
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
  private addToHistory(request: AIRequest): void {
    const historyItem: AIHistoryItem = {
      id: request.id,
      operation: request.operation,
      timestamp: request.createdAt,
      inputPreview: (request as AIRequest & { input?: { imageUrl?: string } }).input?.imageUrl,
      status: request.status,
    };

    this.history.unshift(historyItem);
    if (this.history.length > this.MAX_HISTORY) {
      this.history.pop();
    }
  }

  private updateHistory(request: AIRequest): void {
    const index = this.history.findIndex((h) => h.id === request.id);
    if (index !== -1) {
      this.history[index] = {
        ...this.history[index],
        status: request.status,
        outputPreview: (request as AIRequest & { output?: { imageUrl?: string } }).output?.imageUrl,
      };
    }
  }
}

export const aiService = AIService.getInstance();
export default AIService;


