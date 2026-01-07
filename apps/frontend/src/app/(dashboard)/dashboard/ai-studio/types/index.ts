/**
 * Types pour AI Studio
 */

export type GenerationType = '2d' | '3d' | 'animation' | 'template';
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type AIModel = 'dall-e-3' | 'midjourney' | 'stable-diffusion' | 'leonardo';

export interface Generation {
  id: string;
  type: GenerationType;
  prompt: string;
  status: GenerationStatus;
  result?: string;
  thumbnail?: string;
  createdAt: Date;
  credits: number;
  model: string;
  parameters?: Record<string, unknown>;
  revisedPrompt?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  prompt: string;
  parameters: Record<string, unknown>;
  usageCount: number;
  rating: number;
  isPublic: boolean;
}

export interface AISettings {
  model: AIModel;
  size: string;
  quality: 'standard' | 'hd';
  style: 'vivid' | 'natural';
  guidanceScale?: number;
  steps?: number;
}


