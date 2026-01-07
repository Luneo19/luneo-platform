/**
 * Types locaux pour la page Products
 */

import type { Product, ProductCategory, ProductStatus } from '@/lib/types/product';

export interface ProductFilters {
  search: string;
  category: string;
  status: string;
  priceMin: number | null;
  priceMax: number | null;
  dateFrom: string | null;
  dateTo: string | null;
  isActive: boolean | null;
  isPublic: boolean | null;
}

export interface SortOption {
  field: 'name' | 'price' | 'createdAt' | 'updatedAt' | 'views' | 'orders';
  direction: 'asc' | 'desc';
}

export interface BulkAction {
  type: 'delete' | 'archive' | 'activate' | 'deactivate' | 'export';
  label: string;
  icon: React.ElementType;
  variant: 'default' | 'destructive' | 'outline';
}

export interface ProductDisplay extends Product {
  image_url?: string;
  views: number;
  orders: number;
  sku?: string;
  tags: string[];
}

export type { Product, ProductCategory, ProductStatus };


