/**
 * Constants for Customizer
 */

export const VIEW_MODES = {
  FRONT: 'front',
  BACK: 'back',
  LEFT: 'left',
  RIGHT: 'right',
  '3D': '3d',
} as const;

export type ViewMode = typeof VIEW_MODES[keyof typeof VIEW_MODES];

export const DEFAULT_CANVAS_SIZE = {
  width: 800,
  height: 600,
};

export const ZOOM_LEVELS = {
  MIN: 0.25,
  MAX: 4,
  STEP: 0.25,
  DEFAULT: 1,
};

export const LAYER_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  SHAPE: 'shape',
  DESIGN: 'design',
} as const;

export type LayerType = typeof LAYER_TYPES[keyof typeof LAYER_TYPES];
