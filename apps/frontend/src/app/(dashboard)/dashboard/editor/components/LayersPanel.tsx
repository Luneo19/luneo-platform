/**
 * Panneau des calques
 */

'use client';

import { Layers, Eye, EyeOff, Lock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Layer } from '../types';

interface LayersPanelProps {
  layers: Layer[];
  selectedLayer: string | null;
  onSelectLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
}

export function LayersPanel({
  layers,
  selectedLayer,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onDeleteLayer,
}: LayersPanelProps) {
  return (
    <div className="w-64 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-white font-medium flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Calques
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {layers.length === 0 ? (
            <p className="text-gray-400 text-sm p-4 text-center">Aucun calque</p>
          ) : (
            layers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={cn(
                  'p-2 rounded cursor-pointer flex items-center justify-between group',
                  selectedLayer === layer.id
                    ? 'bg-blue-500/20 border border-blue-500/50'
                    : 'hover:bg-gray-700'
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs text-gray-400 w-6">{layer.type === 'text' ? 'T' : layer.type === 'image' ? 'I' : 'S'}</span>
                  <span className="text-sm text-white truncate">{layer.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(layer.id);
                    }}
                  >
                    {layer.visible ? (
                      <Eye className="w-3 h-3 text-gray-400" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock(layer.id);
                    }}
                  >
                    <Lock className={cn('w-3 h-3', layer.locked ? 'text-yellow-400' : 'text-gray-400')} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLayer(layer.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
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



