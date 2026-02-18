/**
 * Shared types for the customizer engine
 */

export interface ZoneConfig {
  id: string;
  name: string;
  type: 'rect' | 'circle' | 'ellipse' | 'polygon';
  shape: {
    x: number;
    y: number;
    width: number;
    height: number;
    radius?: number; // For circle
    radiusX?: number; // For ellipse
    radiusY?: number; // For ellipse
    points?: number[]; // For polygon
  };
  constraints?: {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    minScale?: number;
    maxScale?: number;
    allowRotation?: boolean;
    maxElements?: number;
    allowedTypes?: ('text' | 'image' | 'shape')[];
  };
  clipContent?: boolean;
  visible?: boolean;
  locked?: boolean;
}
