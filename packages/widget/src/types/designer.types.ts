// Types complets pour le widget éditeur

export interface WidgetConfig {
  container: string | HTMLElement;
  apiKey: string;
  productId: string;
  locale?: string;
  theme?: 'light' | 'dark';
  onSave?: (designData: DesignData) => void;
  onError?: (error: Error) => void;
  onReady?: () => void;
}

export interface DesignData {
  id?: string;
  productId: string;
  canvas: CanvasData;
  layers: Layer[];
  metadata: DesignMetadata;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface CanvasData {
  width: number;
  height: number;
  backgroundColor: string;
  zoom: number;
  panX: number;
  panY: number;
}

export interface Layer {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  position: Position;
  rotation: number;
  scale: Scale;
  opacity: number;
  data: TextLayerData | ImageLayerData | ShapeLayerData;
}

export type LayerType = 'text' | 'image' | 'shape' | 'clipart';

export interface Position {
  x: number;
  y: number;
}

export interface Scale {
  x: number;
  y: number;
}

export interface TextLayerData {
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  color: string;
  backgroundColor?: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  maxWidth?: number;
  curve?: number; // Pour texte courbe
}

export interface ImageLayerData {
  src: string;
  originalSrc: string;
  width: number;
  height: number;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  filters?: ImageFilter[];
}

export interface ImageFilter {
  type: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'grayscale';
  value: number;
}

export interface ShapeLayerData {
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'polygon' | 'star' | 'custom';
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius?: number;
  points?: number; // Pour polygon/star
  innerRadius?: number; // Pour star
  path?: string; // Pour custom (SVG path)
}

export interface DesignMetadata {
  productVariant?: string;
  selectedColor?: string;
  selectedSize?: string;
  customizationZone?: string;
  printArea?: PrintArea;
}

export interface PrintArea {
  x: number;
  y: number;
  width: number;
  height: number;
  dpi: number;
}

export interface HistoryState {
  past: DesignData[];
  present: DesignData;
  future: DesignData[];
  maxStates: number;
}

export interface HistoryActions {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SaveDesignResponse {
  designId: string;
  previewUrl: string;
  printFileUrl?: string;
}

export interface ProductConfig {
  id: string;
  name: string;
  mockups: {
    front?: string;
    back?: string;
    left?: string;
    right?: string;
  };
  customizableAreas: CustomizableArea[];
  availableOptions: ProductOptions;
}

export interface CustomizableArea {
  id: string;
  name: string;
  position: Position;
  dimensions: { width: number; height: number };
  allowedTypes: LayerType[];
  constraints?: AreaConstraints;
}

export interface AreaConstraints {
  maxLayers?: number;
  maxTextLength?: number;
  allowedFonts?: string[];
  allowedColors?: string[];
  maxImageSizeMB?: number;
  minDPI?: number;
}

export interface ProductOptions {
  colors: ProductColor[];
  sizes: ProductSize[];
  materials?: ProductMaterial[];
}

export interface ProductColor {
  id: string;
  name: string;
  hex: string;
  mockupUrl?: string;
}

export interface ProductSize {
  id: string;
  name: string;
  dimensions?: { width: number; height: number };
}

export interface ProductMaterial {
  id: string;
  name: string;
  priceModifier?: number;
}


