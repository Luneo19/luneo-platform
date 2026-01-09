/**
 * Canvas de l'éditeur
 */

'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Layer } from '../types';

interface EditorCanvasProps {
  layers: Layer[];
  selectedLayer: string | null;
  zoom: number;
  showGrid: boolean;
  showGuides: boolean;
  onSelectLayer: (layerId: string | null) => void;
}

export function EditorCanvas({
  layers,
  selectedLayer,
  zoom,
  showGrid,
  showGuides,
  onSelectLayer,
}: EditorCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={canvasRef}
      className="flex-1 relative bg-gray-900 overflow-hidden"
      style={{ transform: `scale(${zoom / 100})` }}
      onClick={() => onSelectLayer(null)}
    >
      {showGrid && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
      )}
      {showGuides && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-500/50" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-500/50" />
        </div>
      )}
      <div className="absolute inset-0">
        {layers.map((layer) => (
          <div
            key={layer.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectLayer(layer.id);
            }}
            className={cn(
              'absolute border-2 transition-all',
              selectedLayer === layer.id
                ? 'border-blue-500'
                : 'border-transparent hover:border-gray-500'
            )}
            style={{
              left: `${layer.x}px`,
              top: `${layer.y}px`,
              width: `${layer.width}px`,
              height: `${layer.height}px`,
              opacity: layer.opacity / 100,
              transform: `rotate(${layer.rotation}deg)`,
              zIndex: layer.zIndex,
              display: layer.visible ? 'block' : 'none',
            }}
          >
            {layer.type === 'text' && (
              <div className="w-full h-full flex items-center justify-center bg-white/10 text-white p-2">
                Texte
              </div>
            )}
            {layer.type === 'image' && (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400">
                Image
              </div>
            )}
            {layer.type === 'shape' && (
              <div
                className="w-full h-full"
                style={{
                  backgroundColor: (layer.data as any).fill || '#3B82F6',
                  borderRadius: `${(layer.data as any).borderRadius || 0}px`,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}



