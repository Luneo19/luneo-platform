/**
 * Types pour AR Studio Preview
 */

export type ARMode = 'face' | 'world' | 'image';
export type ARPlatform = 'ios' | 'android' | 'web';
export type ARModelStatus = 'ready' | 'processing' | 'error';

export interface ARModel {
  id: string;
  name: string;
  thumbnail: string;
  category: string;
  format: string;
  size: number;
  polyCount: number;
  status: ARModelStatus;
  createdAt: number;
  views: number;
  sessions: number;
  avgSessionDuration: number;
  isFavorite?: boolean;
  tags?: string[];
  description?: string;
  arMode?: ARMode;
  platformSupport?: ARPlatform[];
}

export interface ARSession {
  id: string;
  modelId: string;
  modelName: string;
  startedAt: number;
  duration: number;
  platform: ARPlatform;
  status: 'completed' | 'cancelled';
}

export interface ARPreviewStats {
  totalModels: number;
  totalViews: number;
  totalSessions: number;
  avgSessionDuration: number;
  readyModels: number;
  byPlatform: {
    ios: number;
    android: number;
    web: number;
  };
}



