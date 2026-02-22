'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useCanvasStore } from '@/stores/customizer';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;

/**
 * ZoomControls - Zoom widget with slider and buttons
 */
export function ZoomControls() {
  const { zoom, setZoom, resetZoom } = useCanvasStore();
  const zoomPercent = Math.round(zoom * 100);

  const handleZoomChange = (value: number[]) => {
    setZoom(value[0] / 100);
  };

  const handleZoomIn = () => {
    setZoom(Math.min(MAX_ZOOM, zoom + ZOOM_STEP));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(MIN_ZOOM, zoom - ZOOM_STEP));
  };

  const handleReset = () => {
    resetZoom();
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= MIN_ZOOM}>
        <Minus className="h-4 w-4" />
      </Button>

      <div className="flex w-32 items-center gap-2">
        <Slider
          value={[zoomPercent]}
          onValueChange={handleZoomChange}
          min={MIN_ZOOM * 100}
          max={MAX_ZOOM * 100}
          step={ZOOM_STEP * 100}
          className="flex-1"
        />
        <span className="w-12 text-sm text-muted-foreground">{zoomPercent}%</span>
      </div>

      <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= MAX_ZOOM}>
        <Plus className="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="icon" onClick={handleReset} title="Reset to 100%">
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
