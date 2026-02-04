/**
 * Types for Customizer
 */

export type CustomizerTab = 'products' | 'templates' | 'layers' | 'assets' | 'settings';

export interface Asset {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'svg' | 'icon';
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
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  data: {
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
  thumbnailUrl: string;
  category: string;
  tags?: string[];
  layers: Layer[];
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
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
