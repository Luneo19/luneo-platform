'use client';

import { Layer, Line } from 'react-konva';
import { useCustomizerStore } from '@/stores/customizer';

interface GridOverlayProps {
  width: number;
  height: number;
}

/**
 * GridOverlay - Grid pattern overlay on canvas
 */
export function GridOverlay({ width, height }: GridOverlayProps) {
  const config = useCustomizerStore((state) => state.config);
  const gridSize = config?.ui?.gridSize || 20;

  const lines: Array<{ points: number[]; key: string }> = [];

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    lines.push({
      points: [x, 0, x, height],
      key: `v-${x}`,
    });
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    lines.push({
      points: [0, y, width, y],
      key: `h-${y}`,
    });
  }

  return (
    <Layer name="grid" listening={false}>
      {lines.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          stroke="#e5e7eb"
          strokeWidth={1}
          opacity={0.5}
          perfectDrawEnabled={false}
        />
      ))}
    </Layer>
  );
}
