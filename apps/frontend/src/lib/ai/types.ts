/**
 * AI Module Types
 * Types pour les fonctionnalités IA de Luneo
 */

// AI Operations
export type AIOperation =
  | 'background_removal'
  | 'upscale'
  | 'color_extraction'
  | 'style_transfer'
  | 'text_to_design'
  | 'smart_crop'
  | 'enhance'
  | 'colorize';

// Operation status
export type AIOperationStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Base AI request
export interface AIRequest {
  id: string;
  operation: AIOperation;
  status: AIOperationStatus;
  createdAt: number;
  completedAt?: number;
  error?: string;
}

// Background removal
export interface BackgroundRemovalRequest extends AIRequest {
  operation: 'background_removal';
  input: {
    imageUrl: string;
    mode: 'auto' | 'person' | 'product' | 'animal';
  };
  output?: {
    imageUrl: string;
    maskUrl?: string;
  };
}

// Image upscaling
export interface UpscaleRequest extends AIRequest {
  operation: 'upscale';
  input: {
    imageUrl: string;
    scale: 2 | 4;
    enhanceDetails?: boolean;
    denoiseStrength?: number;
  };
  output?: {
    imageUrl: string;
    originalSize: { width: number; height: number };
    newSize: { width: number; height: number };
  };
}

// Color extraction
export interface ColorExtractionRequest extends AIRequest {
  operation: 'color_extraction';
  input: {
    imageUrl: string;
    maxColors: number;
    includeNeutral?: boolean;
  };
  output?: {
    colors: ExtractedColor[];
    dominantColor: string;
    palette: string[];
  };
}

export interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  percentage: number;
  name?: string;
}

// Style transfer
export interface StyleTransferRequest extends AIRequest {
  operation: 'style_transfer';
  input: {
    contentImageUrl: string;
    styleImageUrl: string;
    strength: number; // 0-1
  };
  output?: {
    imageUrl: string;
  };
}

// Text to design
export interface TextToDesignRequest extends AIRequest {
  operation: 'text_to_design';
  input: {
    prompt: string;
    style?: 'modern' | 'vintage' | 'minimal' | 'bold' | 'playful';
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
    colorScheme?: string[];
    negativePrompt?: string;
  };
  output?: {
    imageUrl: string;
    variations?: string[];
    metadata: {
      model: string;
      seed: number;
      steps: number;
    };
  };
}

// Smart crop
export interface SmartCropRequest extends AIRequest {
  operation: 'smart_crop';
  input: {
    imageUrl: string;
    targetAspectRatio: string;
    focusPoint?: 'auto' | 'face' | 'center' | 'product';
  };
  output?: {
    imageUrl: string;
    cropArea: { x: number; y: number; width: number; height: number };
    detectedSubjects?: { type: string; bbox: number[] }[];
  };
}

// AI History
export interface AIHistoryItem {
  id: string;
  operation: AIOperation;
  timestamp: number;
  inputPreview?: string;
  outputPreview?: string;
  status: AIOperationStatus;
}

// AI Quota
export interface AIQuota {
  used: number;
  limit: number;
  resetAt: number;
  operations: Record<AIOperation, { used: number; limit: number }>;
}

// AI Provider config
export interface AIProviderConfig {
  provider: 'replicate' | 'stability' | 'openai' | 'huggingface' | 'local';
  apiKey?: string;
  baseUrl?: string;
  models: Record<AIOperation, string>;
}


