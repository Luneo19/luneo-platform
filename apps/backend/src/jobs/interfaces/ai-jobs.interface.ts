export interface GenerateDesignJob {
  designId: string;
  prompt: string;
  options: Record<string, unknown>;
  userId: string;
  brandId: string;
  originalLocale?: string;
  normalizedLocale?: string;
}

export interface GenerateHighResJob {
  designId: string;
  prompt: string;
  options: Record<string, unknown>;
  userId: string;
  originalLocale?: string;
  normalizedLocale?: string;
}

export interface GenerateImageJobPayload {
  prompt: string;
  style: string;
  dimensions: string;
  quality: 'standard' | 'hd';
  userId: string;
  designId: string;
}

export interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  metadata?: {
    dimensions: string;
    fileSize: number;
    format: string;
    generationTime: number;
  };
  error?: string;
}

export interface UpscaleJobPayload {
  imageUrl: string;
  designId: string;
  userId: string;
  scale?: number;
  format?: 'png' | 'jpg' | 'jpeg' | 'webp';
}

export interface UpscaleResult {
  success: boolean;
  imageUrl?: string;
  metadata?: {
    width: number;
    height: number;
    scale: number;
    format: string;
    fileSize: number;
  };
  error?: string;
}

