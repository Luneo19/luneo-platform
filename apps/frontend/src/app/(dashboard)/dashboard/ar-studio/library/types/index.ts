/**
 * Types pour AR Studio Library
 */

export type ARModelType = 'glasses' | 'watch' | 'jewelry' | 'furniture' | 'clothing' | 'other';
export type ARModelStatus = 'active' | 'draft' | 'archived';
export type ARModelFormat = 'USDZ' | 'GLB' | 'OBJ' | 'FBX' | 'DAE';

export interface ARModel {
  id: string;
  name: string;
  type: ARModelType;
  thumbnail: string;
  size: number; // bytes
  format: ARModelFormat[];
  status: ARModelStatus;
  views: number;
  downloads: number;
  favorites: number;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  description: string;
  category: string;
  polyCount: number;
  vertices: number;
  faces: number;
  textures: number;
  materials: number;
  isFavorite: boolean;
  isPublic: boolean;
  version: number;
  author: string;
  license: string;
}

export interface ARLibraryStats {
  totalModels: number;
  totalSize: number;
  totalViews: number;
  totalDownloads: number;
  totalFavorites: number;
}


