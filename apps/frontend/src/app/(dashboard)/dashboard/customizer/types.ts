/**
 * Types for Customizer
 */

export type CustomizerTab = 'products' | 'templates' | 'layers' | 'assets' | 'settings';

export interface Asset {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  type: 'image' | 'svg' | 'icon' | 'video' | 'texture' | 'pattern';
  category?: string;
  tags?: string[];
  width?: number;
  height?: number;
  createdAt?: Date | string;
}

export interface Layer {
  id: string;
  type: 'text' | 'image' | 'shape' | 'design';
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  order: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  zIndex?: number;
  data?: {
    content?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: string;
    src?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    [key: string]: unknown;
  };
}

export interface DesignTemplate {
  id: string;
  name: string;
  description?: string;
  thumbnail: string;
  thumbnailUrl?: string;
  category: string;
  isPremium?: boolean;
  downloads?: number;
  rating?: number;
  tags?: string[];
  layers?: Layer[];
  canvasSize?: {
    width: number;
    height: number;
  };
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  status?: string;
  priceMin?: number | null;
  priceMax?: number | null;
  minPrice?: number;
  maxPrice?: number;
  dateFrom?: string | null;
  dateTo?: string | null;
  isActive?: boolean | null;
  tags?: string[];
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
