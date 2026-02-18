'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Undo2, Redo2, Save, Download, Type, Image, Shapes, MousePointer2, Pencil, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolType } from '@/stores/customizer';

interface MobileToolbarProps {
  activeTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExport: () => void;
}

const tools: Array<{ id: ToolType; icon: React.ComponentType<{ className?: string }>; label: string }> = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'image', icon: Image, label: 'Image' },
  { id: 'shape', icon: Shapes, label: 'Shape' },
  { id: 'draw', icon: Pencil, label: 'Draw' },
  { id: 'qrCode', icon: QrCode, label: 'QR' },
];

export function MobileToolbar({
  activeTool,
  onToolSelect,
  onUndo,
  onRedo,
  onSave,
  onExport,
}: MobileToolbarProps) {
  return (
    <div className="border-t bg-background safe-area-bottom">
      <div className="flex items-center justify-between px-2 py-2">
        {/* Left: Undo/Redo */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-10 w-10 p-0"
            onClick={onUndo}
          >
            <Undo2 className="h-5 w-5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-10 w-10 p-0"
            onClick={onRedo}
          >
            <Redo2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Center: Tools Scroll */}
        <ScrollArea className="flex-1 mx-2">
          <div className="flex gap-1 px-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <Button
                  key={tool.id}
                  size="sm"
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'h-10 w-10 p-0 flex-shrink-0',
                    isActive && 'bg-primary text-primary-foreground'
                  )}
                  onClick={() => onToolSelect(tool.id)}
                >
                  <Icon className="h-5 w-5" />
                </Button>
              );
            })}
          </div>
        </ScrollArea>

        {/* Right: Save/Export */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-10 w-10 p-0"
            onClick={onSave}
          >
            <Save className="h-5 w-5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-10 w-10 p-0"
            onClick={onExport}
          >
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
