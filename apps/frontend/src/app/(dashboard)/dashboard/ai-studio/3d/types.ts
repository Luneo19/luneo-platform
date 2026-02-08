/**
 * Types for AI Studio 3D
 */

export type AIStudioTab =
  | 'generate'
  | 'history'
  | 'templates'
  | 'analytics'
  | 'ai-ml'
  | 'collaboration'
  | 'performance'
  | 'security'
  | 'i18n'
  | 'accessibility'
  | 'workflow';

export interface GeneratedModel {
  id: string;
  name: string;
  prompt: string;
  thumbnail: string;
  thumbnailUrl?: string;
  modelUrl?: string;
  category: string;
  complexity: string;
  resolution: string;
  polyCount?: number;
  createdAt: Date | number | string;
  credits: number;
  creditsUsed?: number;
  isFavorite?: boolean;
  tags?: string[];
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    textureQuality?: number;
    size?: number;
    vertices?: number;
    faces?: number;
    textures?: number;
    materials?: number;
    model?: string;
    seed?: number;
    [key: string]: unknown;
  };
}

export interface GenerationTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  thumbnailUrl?: string;
  category: string;
  prompt: string;
  complexity: string;
  uses: number;
  settings?: {
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
