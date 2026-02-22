'use client';

import { Layer, Rect } from 'react-konva';
import { useCustomizerStore } from '@/stores/customizer';

interface SafeZoneOverlayProps {
  width: number;
  height: number;
}

/**
 * SafeZoneOverlay - Safe zone indicator (dotted rectangle)
 */
export function SafeZoneOverlay({ width, height }: SafeZoneOverlayProps) {
  const config = useCustomizerStore((state) => state.config);
  const safeZoneMargin = config?.ui?.safeZoneMargin || 20;

  const safeZoneX = safeZoneMargin;
  const safeZoneY = safeZoneMargin;
  const safeZoneWidth = width - safeZoneMargin * 2;
  const safeZoneHeight = height - safeZoneMargin * 2;

  return (
    <Layer name="safeZone" listening={false}>
      <Rect
        x={safeZoneX}
        y={safeZoneY}
        width={safeZoneWidth}
        height={safeZoneHeight}
        stroke="#3B82F6"
        strokeWidth={1}
        dash={[5, 5]}
        opacity={0.6}
        perfectDrawEnabled={false}
      />
    </Layer>
  );
}
