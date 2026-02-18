'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ZoomIn, ZoomOut, Maximize2, Grid, Ruler, Info } from 'lucide-react';
import { useCanvasStore } from '@/stores/customizer';
import { ZoomControls } from './ZoomControls';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

/**
 * CanvasControls - Toolbar above canvas with zoom, grid, rulers controls
 */
export function CanvasControls() {
  const {
    zoom,
    zoomIn,
    zoomOut,
    fitToScreen,
    showGrid,
    showRulers,
    toggleGrid,
    toggleRulers,
    canvasWidth,
    canvasHeight,
  } = useCanvasStore();

  return (
    <TooltipProvider>
      <div className="flex h-10 items-center gap-2 border-b bg-background px-4">
        {/* Zoom Controls */}
        <ZoomControls />

        <Separator orientation="vertical" className="h-6" />

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={fitToScreen}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fit to Screen</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          {/* Grid Toggle */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Grid className="h-4 w-4" />
                  <Switch id="grid-toggle" checked={showGrid} onCheckedChange={toggleGrid} />
                  <Label htmlFor="grid-toggle" className="sr-only">
                    Show Grid
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>Toggle Grid</TooltipContent>
            </Tooltip>
          </div>

          {/* Rulers Toggle */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  <Switch id="rulers-toggle" checked={showRulers} onCheckedChange={toggleRulers} />
                  <Label htmlFor="rulers-toggle" className="sr-only">
                    Show Rulers
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>Toggle Rulers</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Canvas Info */}
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>
            {Math.round(canvasWidth)} × {Math.round(canvasHeight)}px
          </span>
          <span>•</span>
          <span>{Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
