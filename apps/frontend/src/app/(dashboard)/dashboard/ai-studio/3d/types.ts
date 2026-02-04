/**
 * Types for AI Studio 3D
 */

export type AIStudioTab = 'generate' | 'models' | 'templates' | 'settings';

export interface GeneratedModel {
  id: string;
  name: string;
  thumbnailUrl: string;
  modelUrl: string;
  category: string;
  complexity: string;
  polyCount: number;
  createdAt: Date;
  credits: number;
  creditsUsed?: number;
  isFavorite?: boolean;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    textureQuality?: number;
    [key: string]: unknown;
  };
}

export interface GenerationTemplate {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  category: string;
  prompt: string;
  settings: {
    complexity: string;
    resolution: string;
    polyCount: number;
    textureQuality: number;
  };
}

export interface AIStudioStats {
  totalGenerations: number;
  totalCredits: number;
  avgGenerationTime: number;
  successRate: number;
  favoriteCount: number;
  byCategory: {
    product: number;
    furniture: number;
    jewelry: number;
    electronics: number;
    fashion: number;
  };
  avgPolyCount: number;
}
