'use client';

import { useDesignerStore } from '../../store/designerStore';
import { LayerItem } from './LayerItem';

export function LayersPanel() {
  const { design, selectedLayerId, selectLayer } = useDesignerStore();
  
  if (!design) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        Aucun calque
      </div>
    );
  }
  
  const sortedLayers = [...design.layers].sort((a, b) => b.zIndex - a.zIndex);
  
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Calques</h3>
      <div className="space-y-1">
        {sortedLayers.map((layer) => (
          <LayerItem
            key={layer.id}
            layer={layer}
            isSelected={selectedLayerId === layer.id}
            onSelect={() => selectLayer(layer.id)}
          />
        ))}
      </div>
    </div>
  );
}



