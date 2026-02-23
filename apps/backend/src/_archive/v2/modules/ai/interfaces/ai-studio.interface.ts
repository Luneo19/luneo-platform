/**
 * ★★★ INTERFACES - AI STUDIO ★★★
 * Interfaces TypeScript pour AI Studio
 * Respecte les patterns existants du projet
 */

// ========================================
// GÉNÉRATIONS
// ========================================

export enum AIGenerationType {
  IMAGE_2D = 'IMAGE_2D',
  MODEL_3D = 'MODEL_3D',
  ANIMATION = 'ANIMATION',
  TEMPLATE = 'TEMPLATE',
}

export enum AIGenerationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface AIGenerationParams {
  steps?: number;
  guidance?: number;
  seed?: number;
  aspectRatio?: string;
  quality?: 'standard' | 'high' | 'ultra';
  negativePrompt?: string;
  [key: string]: string | number | boolean | undefined; // Flexible pour différents modèles
}

export interface AIGeneration {
  id: string;
  type: AIGenerationType;
  prompt: string;
  negativePrompt?: string;
  model: string;
  provider: string;
  parameters: AIGenerationParams;
  status: AIGenerationStatus;
  resultUrl?: string;
  thumbnailUrl?: string;
  credits: number;
  costCents: number;
  duration?: number;
  quality?: number;
  error?: string;
  userId: string;
  brandId: string;
  parentGenerationId?: string;
  createdAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

// ========================================
// MODÈLES IA
// ========================================

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  type: AIGenerationType;
  costPerGeneration: number;
  avgTime: number; // secondes
  quality: number; // 0-100
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface ModelComparison {
  model1: string;
  model2: string;
  metric: string;
  winner: string;
  insight: string;
  data: {
    model1: {
      value: number;
      cost: number;
      time: number;
    };
    model2: {
      value: number;
      cost: number;
      time: number;
    };
  };
}

// ========================================
// PROMPTS
// ========================================

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  prompt: string;
  variables?: Record<string, string>;
  successRate: number;
  usageCount: number;
  userId?: string;
  brandId?: string;
  createdAt: Date;
}

export interface PromptSuggestion {
  input: string;
  suggestions: string[];
  confidence: number;
}

export interface PromptOptimization {
  original: string;
  optimized: string;
  improvement: string;
  before: number;
  after: number;
}

// ========================================
// COLLECTIONS
// ========================================

export interface AICollection {
  id: string;
  name: string;
  description?: string;
  isShared: boolean;
  userId: string;
  brandId: string;
  generationCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// VERSIONING
// ========================================

export interface AIVersion {
  id: string;
  generationId: string;
  version: number;
  prompt: string;
  parameters: AIGenerationParams;
  resultUrl: string;
  quality?: number;
  credits: number;
  createdAt: Date;
}

// ========================================
// ANALYTICS IA
// ========================================

export interface AIGenerationAnalytics {
  totalGenerations: number;
  successRate: number;
  avgTime: number;
  avgCost: number;
  totalCost: number;
  satisfaction: number;
  trends: {
    generations: string;
    success: string;
    cost: string;
  };
}

export interface AIModelPerformance {
  model: string;
  totalGenerations: number;
  successRate: number;
  avgTime: number;
  avgCost: number;
  totalCost: number;
  satisfaction: number;
  bestFor: string[];
  worstFor: string[];
}











