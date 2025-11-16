import type React from 'react';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type ModelViewerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string;
  poster?: string;
  alt?: string;
  'auto-rotate'?: boolean | string;
  'auto-rotate-delay'?: number | string;
  'camera-controls'?: boolean | string;
  'camera-orbit'?: string;
  'camera-target'?: string;
  'field-of-view'?: string;
  ar?: boolean | string;
  'ar-modes'?: string;
  'ar-scale'?: 'auto' | 'fixed';
  'ar-placement'?: 'floor' | 'wall';
  'ios-src'?: string;
  'shadow-intensity'?: string | number;
  'environment-image'?: string;
  exposure?: string | number;
  'tone-mapping'?: string;
  'interaction-prompt'?: string;
  'interaction-prompt-threshold'?: number | string;
  'loading'?: 'auto' | 'lazy' | 'eager';
  'reveal'?: 'auto' | 'interaction' | 'manual';
  'poster-animation'?: string;
  'max-camera-orbit'?: string;
  'min-camera-orbit'?: string;
  'max-field-of-view'?: string;
  'min-field-of-view'?: string;
  'animation-name'?: string;
  'animation-crossfade-duration'?: number | string;
  'touch-action'?: string;
  'disable-zoom'?: boolean | string;
  style?: React.CSSProperties;
  onload?: (event: Event) => void;
  onerror?: (event: Event) => void;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes;
    }
  }
}

export {};


