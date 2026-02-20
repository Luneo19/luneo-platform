'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Undo2,
  Redo2,
  MousePointer2,
  Type,
  Image as ImageIcon,
  Shapes,
  Pencil,
  Eraser,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Save,
  Download,
  Share2,
  Menu,
  X,
} from 'lucide-react';
import { useHistory } from '@/hooks/customizer';
import { useTool } from '@/hooks/customizer';
import { useCanvas } from '@/hooks/customizer';
import { useSession } from '@/hooks/customizer';
import { useCustomizerStore, useUIStore } from '@/stores/customizer';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import type { ToolType } from '@/stores/customizer';

const toolButtons: Array<{ tool: ToolType; icon: typeof MousePointer2; label: string; shortcut: string }> = [
  { tool: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { tool: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  { tool: 'image', icon: ImageIcon, label: 'Image', shortcut: 'I' },
  { tool: 'shape', icon: Shapes, label: 'Shape', shortcut: 'S' },
  { tool: 'draw', icon: Pencil, label: 'Draw', shortcut: 'D' },
  { tool: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
];

/**
 * CustomizerToolbar - Main horizontal toolbar with actions and tools
 * Responsive: collapses to hamburger menu on mobile
 */
export function CustomizerToolbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { undo, redo, canUndo, canRedo } = useHistory();
  const { activeTool, setActiveTool } = useTool();
  const { zoomIn, zoomOut, fitToScreen, toggleFullscreen, isFullscreen } = useCanvas();
  const config = useCustomizerStore((state) => state.config);
  const { saveDesign } = useSession({ customizerId: config?.id ?? '' });
  const isMobile = useUIStore((state) => state.isMobile);

  const handleSave = async () => {
    const canvasData: Record<string, unknown> = {};
    await saveDesign('Untitled Design', canvasData);
  };

  const handleExport = () => {
    // TODO: Open export dialog
  };

  const handleShare = () => {
    // TODO: Open share dialog
  };

  const ToolbarContent = () => (
    <>
      {/* History */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo}>
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo}>
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Tools */}
      <div className="flex items-center gap-1">
        {toolButtons.map(({ tool, icon: Icon, label, shortcut }) => (
          <Tooltip key={tool}>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === tool ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setActiveTool(tool)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {label} ({shortcut})
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* View Controls */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={fitToScreen}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fit to Screen</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</TooltipContent>
        </Tooltip>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Separator orientation="vertical" className="h-6" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save Design</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export Design</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share Design</TooltipContent>
        </Tooltip>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <div className="flex h-14 items-center border-b bg-background px-4">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <SheetContent side="left" className="w-[300px]">
          <div className="flex flex-col gap-4">
            <ToolbarContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-14 items-center gap-2 border-b bg-background px-4">
        <ToolbarContent />
      </div>
    </TooltipProvider>
  );
}
