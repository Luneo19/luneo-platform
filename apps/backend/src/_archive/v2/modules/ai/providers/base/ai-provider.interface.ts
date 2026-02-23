/**
 * Enhanced AI Provider Interface - Provider Abstraction Layer
 * Supports multi-type providers: IMAGE_2D, MODEL_3D, VIDEO, ENHANCEMENT
 */

export enum AICapability {
  IMAGE_2D = 'IMAGE_2D',
  IMAGE_HD = 'IMAGE_HD',
  MODEL_3D = 'MODEL_3D',
  VIDEO = 'VIDEO',
  UPSCALE = 'UPSCALE',
  BACKGROUND_REMOVAL = 'BACKGROUND_REMOVAL',
  INPAINTING = 'INPAINTING',
  STYLE_TRANSFER = 'STYLE_TRANSFER',
}

export enum ProviderStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNAVAILABLE = 'UNAVAILABLE',
}

export interface ProviderHealthInfo {
  status: ProviderStatus;
  latencyMs: number;
  errorRate: number;
  lastChecked: Date;
  consecutiveFailures: number;
}

export interface EnhancedAIProviderConfig {
  name: string;
  displayName: string;
  enabled: boolean;
  priority: number;
  capabilities: AICapability[];
  costPerUnitCents: Record<string, number>; // e.g. { 'IMAGE_2D': 4, 'IMAGE_HD': 8 }
  maxRetries: number;
  timeoutMs: number;
  rateLimit: { maxPerMinute: number; maxPerHour: number };
}

export interface AIGenerationRequest {
  type: AICapability;
  prompt: string;
  negativePrompt?: string;
  size?: string;
  quality?: 'standard' | 'hd';
  style?: string;
  model?: string;
  parameters?: Record<string, unknown>;
  userId?: string;
  brandId?: string;
}

export interface AIGenerationResponse {
  success: boolean;
  urls: string[];
  thumbnailUrl?: string;
  metadata: {
    provider: string;
    model: string;
    generationTimeMs: number;
    prompt: string;
    revisedPrompt?: string;
    seed?: number;
    width?: number;
    height?: number;
  };
  costs: {
    creditsCost: number;
    realCostCents: number;
  };
}

export interface EnhancedAIProvider {
  getName(): string;
  getDisplayName(): string;
  getConfig(): EnhancedAIProviderConfig;
  getCapabilities(): AICapability[];
  supportsCapability(capability: AICapability): boolean;
  generate(request: AIGenerationRequest): Promise<AIGenerationResponse>;
  estimateCost(request: AIGenerationRequest): { credits: number; costCents: number };
  isAvailable(): Promise<boolean>;
  getHealth(): Promise<ProviderHealthInfo>;
  moderatePrompt?(
    prompt: string,
  ): Promise<{ isApproved: boolean; reason?: string; confidence: number }>;
}
