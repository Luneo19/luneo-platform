/**
 * AI Module
 * Export centralisé du module IA
 */

export { aiService, default as AIService } from './AIService';
export { useAI, default as useAIDefault } from './useAI';

export type {
  AIOperation,
  AIOperationStatus,
  AIRequest,
  BackgroundRemovalRequest,
  UpscaleRequest,
  ColorExtractionRequest,
  StyleTransferRequest,
  TextToDesignRequest,
  SmartCropRequest,
  ExtractedColor,
  AIHistoryItem,
  AIQuota,
  AIProviderConfig,
} from './types';


