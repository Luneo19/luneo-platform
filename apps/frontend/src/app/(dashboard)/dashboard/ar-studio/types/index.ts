/**
 * Types pour la page AR Studio
 */

export type ARModelType = 'glasses' | 'watch' | 'jewelry' | 'furniture' | 'shoes' | 'clothing' | 'other';
export type ARModelStatus = 'active' | 'processing' | 'error' | 'draft';
export type ARModelFormat = 'USDZ' | 'GLB' | 'OBJ' | 'FBX' | 'STL' | 'Both';
export type ViewMode = 'grid' | 'list';

export interface ARModel {
  id: string;
  name: string;
  type: ARModelType;
  thumbnail: string;
  fileSize: number;
  format: ARModelFormat;
  status: ARModelStatus;
  views: number;
  tryOns: number;
  conversions: number;
  createdAt: Date;
  updatedAt: Date;
  glbUrl?: string;
  usdzUrl?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  category?: string;
  productId?: string;
  qrCodeUrl?: string;
  embedCode?: string;
}

export interface ARSession {
  id: string;
  modelId: string;
  userId: string;
  duration: number;
  interactions: number;
  screenshots: number;
  shared: boolean;
  createdAt: Date;
  deviceType?: string;
  platform?: string;
}

export interface ARAnalytics {
  totalViews: number;
  totalTryOns: number;
  totalConversions: number;
  averageSessionDuration: number;
  topModels: Array<{ id: string; name: string; views: number; tryOns: number }>;
  deviceBreakdown: Record<string, number>;
  platformBreakdown: Record<string, number>;
  conversionRate: number;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}


