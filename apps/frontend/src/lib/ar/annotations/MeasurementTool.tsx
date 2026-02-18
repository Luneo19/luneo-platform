'use client';

/**
 * Distance measurement tool: two points in 3D.
 * @module ar/annotations/MeasurementTool
 */

import React, { useState } from 'react';

export interface MeasurementToolProps {
  /** Distance in meters (computed from two points) */
  distance?: number;
  /** Unit label */
  unit?: string;
  /** Callback when measurement is completed (point A, point B) */
  onMeasure?: (pointA: { x: number; y: number; z: number }, pointB: { x: number; y: number; z: number }) => void;
  className?: string;
}

/**
 * React component: displays distance between two points (e.g. after user places A then B).
 */
export function MeasurementTool({
  distance = 0,
  unit = 'm',
  onMeasure,
  className = '',
}: MeasurementToolProps): React.ReactElement {
  const [pointA, setPointA] = useState<{ x: number; y: number; z: number } | null>(null);
  const [pointB, setPointB] = useState<{ x: number; y: number; z: number } | null>(null);

  const displayDistance = distance > 0 ? distance : (pointA && pointB
    ? Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y, pointB.z - pointA.z)
    : 0);

  return (
    <div
      className={`ar-measurement-tool ${className}`}
      role="status"
      aria-label={`Distance: ${displayDistance.toFixed(2)} ${unit}`}
      style={{
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.75)',
        color: '#fff',
        borderRadius: '8px',
        fontSize: '14px',
      }}
    >
      <span className="ar-measurement-tool__value">
        {displayDistance.toFixed(2)} {unit}
      </span>
    </div>
  );
}
