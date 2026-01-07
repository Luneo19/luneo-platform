/**
 * Types pour la page Configurator 3D
 */

export interface Configuration3D {
  id: string;
  productId: string;
  productName?: string;
  material: string;
  color: string;
  engraving?: string;
  texture?: string;
  parts?: Record<string, unknown>;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    thickness?: number;
    unit?: 'mm' | 'cm' | 'm' | 'in' | 'ft';
  };
  variants?: Record<string, unknown>;
  options?: Record<string, unknown>;
  customImages?: Array<{
    id: string;
    url: string;
    position: { x: number; y: number; z: number };
    scale: number;
    rotation: number;
  }>;
  price?: number;
  currency?: string;
  timestamp: number;
  version?: number;
}

export interface Material {
  id: string;
  name: string;
  type: 'leather' | 'fabric' | 'metal' | 'plastic' | 'wood' | 'glass' | 'ceramic';
  color?: string;
  texture?: string;
  preview?: string;
}

export interface Product3D {
  id: string;
  name: string;
  description?: string;
  modelUrl?: string;
  thumbnailUrl?: string;
  price: number;
  currency: string;
}


