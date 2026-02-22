/**
 * Left toolbar: Select, Text, Shapes, Images (+ AI), Draw
 */

'use client';

import {
  MousePointer2,
  Type,
  Square,
  Circle as CircleIcon,
  Image as ImageIcon,
  Pencil,
  Minus,
  Star,
  ArrowRight,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { EditorTool, ShapeKind } from '../types';

interface EditorToolbarProps {
  selectedTool: EditorTool;
  onSelectTool: (tool: EditorTool) => void;
  onAddText: () => void;
  onAddShape: (kind: ShapeKind) => void;
  onAddImageClick: () => void;
  onGenerateAIClick: () => void;
  onDrawMode: () => void;
}

const SHAPES: Array<{ kind: ShapeKind; icon: React.ComponentType<{ className?: string }>; label: string }> = [
  { kind: 'rect', icon: Square, label: 'Rectangle' },
  { kind: 'circle', icon: CircleIcon, label: 'Circle' },
  { kind: 'line', icon: Minus, label: 'Line' },
  { kind: 'star', icon: Star, label: 'Star' },
  { kind: 'arrow', icon: ArrowRight, label: 'Arrow' },
];

export function EditorToolbar({
  selectedTool,
  onSelectTool,
  onAddText,
  onAddShape,
  onAddImageClick,
  onGenerateAIClick,
  onDrawMode,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-col gap-1 w-14 py-4 bg-zinc-900/90 border-r border-zinc-700 shrink-0">
      <ToolButton
        icon={MousePointer2}
        label="Select"
        active={selectedTool === 'select'}
        onClick={() => onSelectTool('select')}
      />
      <ToolButton
        icon={Type}
        label="Text"
        active={selectedTool === 'text'}
        onClick={() => { onSelectTool('text'); onAddText(); }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors',
              selectedTool === 'shape' && 'bg-zinc-800 text-white'
            )}
            title="Shapes"
          >
            <Square className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="bg-zinc-800 border-zinc-700 w-44">
          {SHAPES.map(({ kind, icon: Icon, label }) => (
            <DropdownMenuItem
              key={kind}
              onClick={() => { onSelectTool('shape'); onAddShape(kind); }}
              className="text-zinc-200 focus:bg-zinc-700 flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex flex-col gap-0.5">
        <ToolButton
          icon={ImageIcon}
          label="Image"
          active={selectedTool === 'image'}
          onClick={() => { onSelectTool('image'); onAddImageClick(); }}
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-full justify-center text-xs text-amber-400 hover:text-amber-300 hover:bg-zinc-800"
          onClick={onGenerateAIClick}
        >
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          AI
        </Button>
      </div>
      <ToolButton
        icon={Pencil}
        label="Draw"
        active={selectedTool === 'draw'}
        onClick={() => { onSelectTool('draw'); onDrawMode(); }}
      />
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-md transition-colors',
        active ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
      )}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}
