'use client';

import { Layer, Line, Text } from 'react-konva';
import { useCustomizerStore } from '@/stores/customizer';

interface RulersOverlayProps {
  width: number;
  height: number;
  zoom: number;
}

const RULER_HEIGHT = 20;
const RULER_WIDTH = 20;

/**
 * RulersOverlay - Horizontal and vertical rulers
 */
export function RulersOverlay({ width, height, zoom }: RulersOverlayProps) {
  const config = useCustomizerStore((state) => state.config);
  const gridSize = config?.ui?.gridSize || 20;

  const horizontalLines: Array<{ points: number[]; label: number; key: string }> = [];
  const verticalLines: Array<{ points: number[]; label: number; key: string }> = [];

  // Horizontal ruler (top)
  for (let x = 0; x <= width; x += gridSize) {
    const tickHeight = x % (gridSize * 5) === 0 ? 8 : 4;
    horizontalLines.push({
      points: [x, 0, x, tickHeight],
      label: x,
      key: `h-tick-${x}`,
    });
  }

  // Vertical ruler (left)
  for (let y = 0; y <= height; y += gridSize) {
    const tickWidth = y % (gridSize * 5) === 0 ? 8 : 4;
    verticalLines.push({
      points: [0, y, tickWidth, y],
      label: y,
      key: `v-tick-${y}`,
    });
  }

  return (
    <Layer name="rulers" listening={false}>
      {/* Ruler backgrounds */}
      <Line points={[0, 0, width, 0]} stroke="#f3f4f6" strokeWidth={RULER_HEIGHT} />
      <Line points={[0, 0, 0, height]} stroke="#f3f4f6" strokeWidth={RULER_WIDTH} />

      {/* Horizontal ruler ticks */}
      {horizontalLines.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          stroke="#9ca3af"
          strokeWidth={1}
          perfectDrawEnabled={false}
        />
      ))}

      {/* Vertical ruler ticks */}
      {verticalLines.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          stroke="#9ca3af"
          strokeWidth={1}
          perfectDrawEnabled={false}
        />
      ))}

      {/* Horizontal ruler labels */}
      {horizontalLines
        .filter((line) => line.label % (gridSize * 5) === 0)
        .map((line) => (
          <Text
            key={`h-label-${line.label}`}
            x={line.points[0] + 2}
            y={10}
            text={String(line.label)}
            fontSize={10}
            fill="#6b7280"
            fontFamily="Arial"
          />
        ))}

      {/* Vertical ruler labels */}
      {verticalLines
        .filter((line) => line.label % (gridSize * 5) === 0)
        .map((line) => (
          <Text
            key={`v-label-${line.label}`}
            x={2}
            y={line.points[1] + 2}
            text={String(line.label)}
            fontSize={10}
            fill="#6b7280"
            fontFamily="Arial"
          />
        ))}
    </Layer>
  );
}
