'use client';

import type { ShapeLayerData } from '../../../types/designer.types';

interface ShapeLibraryProps {
  selectedShape: ShapeLayerData['shapeType'] | null;
  onSelect: (shape: ShapeLayerData['shapeType']) => void;
  onAdd: (shape: ShapeLayerData['shapeType']) => void;
}

const SHAPES: Array<{
  type: ShapeLayerData['shapeType'];
  label: string;
  icon: string;
}> = [
  { type: 'rectangle', label: 'Rectangle', icon: '▭' },
  { type: 'circle', label: 'Cercle', icon: '○' },
  { type: 'triangle', label: 'Triangle', icon: '△' },
  { type: 'polygon', label: 'Polygone', icon: '⬡' },
  { type: 'star', label: 'Étoile', icon: '★' },
];

export function ShapeLibrary({ selectedShape, onSelect, onAdd }: ShapeLibraryProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {SHAPES.map((shape) => (
        <button
          key={shape.type}
          onClick={() => {
            onSelect(shape.type);
            onAdd(shape.type);
          }}
          className={`p-3 border-2 rounded-lg text-center transition-colors ${
            selectedShape === shape.type
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-2xl mb-1">{shape.icon}</div>
          <div className="text-xs text-gray-600">{shape.label}</div>
        </button>
      ))}
    </div>
  );
}






