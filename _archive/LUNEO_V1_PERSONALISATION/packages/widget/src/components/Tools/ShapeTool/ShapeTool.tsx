'use client';

import { useState } from 'react';
import { useDesignerStore } from '../../../store/designerStore';
import { ShapeLibrary } from './ShapeLibrary';
import { ColorPicker } from '../ColorPicker/ColorPicker';
import type { ShapeLayerData } from '../../../types/designer.types';

export function ShapeTool() {
  const { activeTool, addLayer } = useDesignerStore();
  const [selectedShape, setSelectedShape] = useState<ShapeLayerData['shapeType'] | null>(null);
  const [fillColor, setFillColor] = useState('#3b82f6');
  const [strokeColor, setStrokeColor] = useState('#1d4ed8');
  const [strokeWidth, setStrokeWidth] = useState(2);
  
  if (activeTool !== 'shape') {
    return null;
  }
  
  const handleAddShape = (shapeType: ShapeLayerData['shapeType']) => {
    addLayer('shape', {
      data: {
        shapeType,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth,
        cornerRadius: shapeType === 'rectangle' ? 8 : undefined,
      },
    });
  };
  
  return (
    <div className="absolute top-16 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 min-w-[300px]">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Ajouter une forme</h3>
      
      <div className="space-y-4">
        <ShapeLibrary
          selectedShape={selectedShape}
          onSelect={setSelectedShape}
          onAdd={handleAddShape}
        />
        
        {selectedShape && (
          <div className="space-y-3 pt-3 border-t border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Couleur de remplissage
              </label>
              <ColorPicker value={fillColor} onChange={setFillColor} />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Couleur de contour
              </label>
              <ColorPicker value={strokeColor} onChange={setStrokeColor} />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Épaisseur du contour: {strokeWidth}px
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}






