import type { RenderOptions, ExportSettings } from './render.interface';

export type RenderJobOptions = RenderOptions | ExportSettings;

export interface RenderJobData {
  renderId: string;
  type: '2d' | '3d' | 'preview' | 'export';
  productId: string;
  designId?: string;
  options: RenderJobOptions;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  userId?: string;
  brandId: string;
  callback?: string;
}

export interface BatchRenderJobPayload {
  batchId: string;
  renders: RenderJobData[];
}

export interface RenderProgressPayload {
  stage: string;
  percentage: number;
  message: string;
  timestamp: Date;
}

export type RenderQueuePayload = RenderJobData | BatchRenderJobPayload;

