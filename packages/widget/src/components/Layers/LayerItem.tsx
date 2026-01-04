'use client';

import { Eye, EyeOff, Lock, Unlock, Trash2, Copy } from 'lucide-react';
import { useDesignerStore } from '../../store/designerStore';
import type { Layer } from '../../types/designer.types';

interface LayerItemProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: () => void;
}

export function LayerItem({ layer, isSelected, onSelect }: LayerItemProps) {
  const {
    toggleLayerVisibility,
    toggleLayerLock,
    deleteLayer,
    duplicateLayer,
  } = useDesignerStore();
  
  const getLayerIcon = () => {
    switch (layer.type) {
      case 'text':
        return 'T';
      case 'image':
        return '🖼️';
      case 'shape':
        return '⬜';
      default:
        return '•';
    }
  };
  
  return (
    <div
      onClick={onSelect}
      className={`p-2 rounded cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <span className="text-xs font-medium">{getLayerIcon()}</span>
          <span className="text-sm text-gray-700 truncate">{layer.name}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLayerVisibility(layer.id);
            }}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title={layer.visible ? 'Masquer' : 'Afficher'}
          >
            {layer.visible ? (
              <Eye className="w-4 h-4 text-gray-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLayerLock(layer.id);
            }}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title={layer.locked ? 'Déverrouiller' : 'Verrouiller'}
          >
            {layer.locked ? (
              <Lock className="w-4 h-4 text-gray-600" />
            ) : (
              <Unlock className="w-4 h-4 text-gray-400" />
            )}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              duplicateLayer(layer.id);
            }}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title="Dupliquer"
          >
            <Copy className="w-4 h-4 text-gray-600" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteLayer(layer.id);
            }}
            className="p-1 rounded hover:bg-red-100 transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}


