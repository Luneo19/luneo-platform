/**
 * Types pour AI Studio Animations
 */

export type AnimationStyle = 'smooth' | 'bounce' | 'fade' | 'slide' | 'zoom';
export type AnimationStatus = 'generating' | 'completed' | 'failed' | 'pending';
export type ExportFormat = 'mp4' | 'gif' | 'webm' | 'mov';

export interface GeneratedAnimation {
  id: string;
  prompt: string;
  duration: number;
  style: AnimationStyle;
  fps: number;
  resolution: string;
  status: AnimationStatus;
  url?: string;
  thumbnail?: string;
  credits: number;
  createdAt: number;
  isFavorite: boolean;
  metadata?: {
    format: string;
    size: number;
    bitrate?: number;
    codec?: string;
    frameCount?: number;
    model?: string;
    seed?: number;
  };
  views?: number;
  likes?: number;
}

export interface AnimationTemplate {
  id: string;
  name: string;
  prompt: string;
  duration: number;
  style: AnimationStyle;
  thumbnail: string;
  uses: number;
  description: string;
  category: string;
}


