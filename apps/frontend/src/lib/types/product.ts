/**
 * ★★★ TYPES - PRODUIT ★★★
 * Types TypeScript complets pour les produits
 * - Types de base
 * - Types API
 * - Types UI
 * - Types analytics
 */

// ========================================
// ENUMS
// ========================================

export enum ProductCategory {
  JEWELRY = 'JEWELRY',
  WATCHES = 'WATCHES',
  GLASSES = 'GLASSES',
  ACCESSORIES = 'ACCESSORIES',
  HOME = 'HOME',
  TECH = 'TECH',
  OTHER = 'OTHER',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

// ========================================
// TYPES DE BASE
// ========================================

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: ProductCategory;
  model3dUrl?: string;
  baseAssetUrl?: string;
  images?: string[];
  price?: number;
  currency: string;
  isActive: boolean;
  status: ProductStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  brandId: string;
  createdBy: string;
}

export interface ProductWithRelations extends Product {
  brand?: {
    id: string;
    name: string;
    logo?: string;
  };
  zones?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  _count?: {
    customizations: number;
    designs: number;
  };
}

// ========================================
// TYPES API
// ========================================

export interface CreateProductRequest {
  name: string;
  description?: string;
  category: ProductCategory;
  model3dUrl?: string;
  baseAssetUrl?: string;
  images?: string[];
  price?: number;
  currency?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

export interface UploadModelRequest {
  productId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export interface ProductListRequest {
  brandId?: string;
  category?: ProductCategory;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ProductListResponse {
  products: ProductWithRelations[];
  total: number;
  hasMore: boolean;
}

// ========================================
// TYPES ANALYTICS
// ========================================

export interface ProductAnalytics {
  totalCustomizations: number;
  completedCustomizations: number;
  failedCustomizations: number;
  successRate: number;
  zonesCount: number;
  designsCount: number;
}

export interface ProductAnalyticsRequest {
  productId: string;
  startDate?: Date;
  endDate?: Date;
}

// ========================================
// TYPES UI
// ========================================

export interface ProductFormState {
  name: string;
  description: string;
  category: ProductCategory;
  model3dUrl: string;
  baseAssetUrl: string;
  images: string[];
  price: number | undefined;
  currency: string;
  isActive: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
}

export interface ProductListState {
  products: ProductWithRelations[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  error: Error | null;
  filters: {
    category?: ProductCategory;
    isActive?: boolean;
    search?: string;
  };
  pagination: {
    limit: number;
    offset: number;
  };
}

// ========================================
// TYPES UTILITAIRES
// ========================================

export interface ProductMetadata {
  modelUpload?: {
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadedAt: string;
  };
  dimensions?: {
    width: number;
    height: number;
    depth: number;
    unit: 'mm' | 'cm' | 'm';
  };
  materials?: string[];
  colors?: string[];
  tags?: string[];
}

export interface ProductExport {
  id: string;
  name: string;
  category: ProductCategory;
  model3dUrl?: string;
  images?: string[];
  zones: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

// ========================================

