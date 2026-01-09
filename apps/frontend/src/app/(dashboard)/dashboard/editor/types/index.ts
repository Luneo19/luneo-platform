/**
 * Types pour Editor
 */

export type EditorTool = 'select' | 'text' | 'image' | 'shape' | 'hand';
export type LayerType = 'text' | 'image' | 'shape';
export type ExportFormat = 'png' | 'svg' | 'pdf' | 'jpg';

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  data: Record<string, unknown>;
}

export interface HistoryState {
  layers: Layer[];
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
  type: string;
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



