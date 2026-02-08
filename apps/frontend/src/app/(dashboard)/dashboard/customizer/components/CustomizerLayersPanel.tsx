'use client';

import React from 'react';
import { Layers, Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Layer } from '../types';

export interface CustomizerLayersPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onAddLayer: (type: Layer['type']) => void;
  onDeleteLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
}

export function CustomizerLayersPanel({
  layers,
  selectedLayerId,
  onSelectLayer,
  onDeleteLayer,
  onToggleVisibility,
  onToggleLock,
  onMoveLayer,
}: CustomizerLayersPanelProps) {
  const sortedLayers = [...layers].sort((a, b) => a.order - b.order);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Calques
        </h3>
      </div>
      <ScrollArea className="h-[200px]">
        <div className="space-y-1">
          {sortedLayers.length === 0 ? (
            <p className="text-xs text-gray-600 py-4 text-center">Aucun calque</p>
          ) : (
            sortedLayers.map((layer) => (
              <div
                key={layer.id}
                className={cn(
                  'flex items-center gap-2 rounded px-2 py-1.5 text-sm',
                  selectedLayerId === layer.id
                    ? 'bg-cyan-600/30 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <button
                  type="button"
                  className="flex-1 text-left truncate"
                  onClick={() => onSelectLayer(layer.id)}
                >
                  {layer.name}
                </button>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onToggleVisibility(layer.id)}
                  >
                    {layer.visible ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-gray-500" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onToggleLock(layer.id)}
                  >
                    {layer.locked ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onMoveLayer(layer.id, 'up')}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onMoveLayer(layer.id, 'down')}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-400 hover:text-red-300"
                    onClick={() => onDeleteLayer(layer.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
