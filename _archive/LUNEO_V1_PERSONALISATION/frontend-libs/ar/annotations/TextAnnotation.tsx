'use client';

/**
 * Text bubble annotation in 3D space.
 * @module ar/annotations/TextAnnotation
 */

import React from 'react';

export interface TextAnnotationProps {
  text: string;
  position?: { x: number; y: number; z: number };
  /** CSS class for styling */
  className?: string;
  /** Inline styles (e.g. for CSS2DRenderer positioning) */
  style?: React.CSSProperties;
}

/**
 * React component: text bubble for 3D annotation.
 */
export function TextAnnotation({
  text,
  className = '',
  style = {},
}: TextAnnotationProps): React.ReactElement {
  return (
    <div
      className={`ar-text-annotation ${className}`}
      role="note"
      aria-label={text}
      style={{
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.8)',
        color: '#fff',
        borderRadius: '8px',
        fontSize: '14px',
        maxWidth: '200px',
        ...style,
      }}
    >
      {text}
    </div>
  );
}
