/**
 * Types for the visual editor (Canva-like)
 */

export type EditorTool = 'select' | 'text' | 'shape' | 'image' | 'draw' | 'hand';

export type ShapeKind = 'rect' | 'circle' | 'line' | 'star' | 'arrow';

export type LayerType = 'text' | 'image' | 'shape' | 'draw';

export type ExportFormat = 'png' | 'jpg' | 'svg' | 'pdf';

export interface CanvasObject {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  opacity: number;
  /** Text content (text type) */
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: 'normal' | 'bold' | 'italic';
  align?: 'left' | 'center' | 'right';
  /** Image URL (image type) */
  src?: string;
  /** Shape kind (shape type) */
  shapeKind?: ShapeKind;
  /** Stroke for shapes */
  stroke?: string;
  strokeWidth?: number;
  /** Line points for draw type [x1,y1,x2,y2,...] */
  points?: number[];
  /** For arrow/line: points as array */
  linePoints?: number[];
  /** Display name in layers panel */
  name: string;
  visible: boolean;
  locked: boolean;
  zIndex: number;
}

export interface Layer extends CanvasObject {
  /** Legacy compatibility: data blob for extra props */
  data?: Record<string, unknown>;
}

export interface HistoryState {
  objects: CanvasObject[];
  timestamp: number;
}

export interface TextTool {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  align: string;
}

export interface ShapeTool {
  type: ShapeKind;
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
}

export interface ImageTool {
  brightness: number;
  contrast: number;
  saturation: number;
  opacity: number;
}

/** Sector template preset */
export interface EditorTemplate {
  id: string;
  name: string;
  sector: 'jewelry' | 'watches' | 'glasses';
  objects: Omit<CanvasObject, 'id' | 'zIndex'>[];
}
