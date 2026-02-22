/**
 * Layers panel: list objects, reorder, visibility, lock, delete
 */

'use client';

import { Layers, Eye, EyeOff, Lock, Unlock, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { CanvasObject } from '../types';

interface LayersPanelProps {
  objects: CanvasObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, direction: 'up' | 'down') => void;
}

function typeIcon(type: CanvasObject['type']) {
  switch (type) {
    case 'text': return 'T';
    case 'image': return 'I';
    case 'shape': return 'S';
    case 'draw': return 'D';
    default: return '?';
  }
}

export function LayersPanel({
  objects,
  selectedId,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onReorder,
}: LayersPanelProps) {
  const sorted = [...objects].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="w-56 flex flex-col bg-zinc-900/90 border-l border-zinc-700 shrink-0">
      <div className="p-3 border-b border-zinc-700">
        <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Layers
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {sorted.length === 0 ? (
            <p className="text-zinc-500 text-xs p-3 text-center">No layers</p>
          ) : (
            sorted.map((obj, index) => (
              <div
                key={obj.id}
                onClick={() => onSelect(obj.id)}
                className={cn(
                  'group flex items-center gap-2 p-2 rounded-md cursor-pointer',
                  selectedId === obj.id
                    ? 'bg-blue-500/20 border border-blue-500/50'
                    : 'hover:bg-zinc-800 border border-transparent'
                )}
              >
                <span className="text-[10px] font-mono w-5 h-5 flex items-center justify-center rounded bg-zinc-700 text-zinc-300 shrink-0">
                  {typeIcon(obj.type)}
                </span>
                <span className="text-sm text-zinc-200 truncate flex-1 min-w-0">{obj.name}</span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-400 hover:text-white"
                    onClick={(e) => { e.stopPropagation(); onReorder(obj.id, 'up'); }}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-400 hover:text-white"
                    onClick={(e) => { e.stopPropagation(); onReorder(obj.id, 'down'); }}
                    disabled={index === sorted.length - 1}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-400 hover:text-white"
                    onClick={(e) => { e.stopPropagation(); onToggleVisibility(obj.id); }}
                  >
                    {obj.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-400 hover:text-white"
                    onClick={(e) => { e.stopPropagation(); onToggleLock(obj.id); }}
                  >
                    {obj.locked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-400 hover:text-red-300"
                    onClick={(e) => { e.stopPropagation(); onDelete(obj.id); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
