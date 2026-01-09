/**
 * Types pour la page Library
 */

export type TemplateCategory = 'tshirt' | 'mug' | 'poster' | 'sticker' | 'card' | 'other';
export type ViewMode = 'grid' | 'list';
export type SortOption = 'recent' | 'popular' | 'name' | 'size';

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  thumbnail: string;
  isPremium: boolean;
  isFavorite: boolean;
  downloads: number;
  views: number;
  rating: number;
  createdAt: string;
  updatedAt?: string;
  tags: string[];
  size?: number;
  format?: string;
  author?: string;
  version?: number;
  collectionId?: string;
  metadata?: {
    width?: number;
    height?: number;
    fileSize?: number;
    colorSpace?: string;
    resolution?: number;
  };
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  itemCount: number;
  createdAt: string;
  isShared: boolean;
  color?: string;
}



