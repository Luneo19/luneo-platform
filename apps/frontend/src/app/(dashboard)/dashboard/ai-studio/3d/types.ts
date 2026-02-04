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
  creditsUsed: number;
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
  totalCreditsUsed: number;
  averageGenerationTime: number;
  successRate: number;
  topCategories: Array<{
    name: string;
    count: number;
  }>;
}
