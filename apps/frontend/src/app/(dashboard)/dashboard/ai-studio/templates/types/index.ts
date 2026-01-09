/**
 * Types pour AI Studio Templates
 */

export type TemplateCategory = 'logo' | 'product' | 'animation' | 'design' | 'illustration' | 'other';
export type TemplateType = 'free' | 'premium';
export type ViewMode = 'grid' | 'list';

export interface AITemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  type: TemplateType;
  thumbnail: string;
  preview?: string;
  price?: number;
  rating: number;
  reviewsCount: number;
  downloads: number;
  views: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  author?: string;
  isFavorite?: boolean;
}



