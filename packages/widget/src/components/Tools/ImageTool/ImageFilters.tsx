'use client';

import type { ImageFilter } from '../../../types/designer.types';

interface ImageFiltersProps {
  filters: ImageFilter[];
  onChange: (filters: ImageFilter[]) => void;
}

export function ImageFilters({ filters, onChange }: ImageFiltersProps) {
  const filterTypes: ImageFilter['type'][] = [
    'brightness',
    'contrast',
    'saturation',
    'blur',
    'grayscale',
  ];
  
  const updateFilter = (type: ImageFilter['type'], value: number) => {
    const existing = filters.find((f) => f.type === type);
    if (existing) {
      onChange(
        filters.map((f) => (f.type === type ? { ...f, value } : f))
      );
    } else {
      onChange([...filters, { type, value }]);
    }
  };
  
  const removeFilter = (type: ImageFilter['type']) => {
    onChange(filters.filter((f) => f.type !== type));
  };
  
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-700">Filtres</h4>
      {filterTypes.map((type) => {
        const filter = filters.find((f) => f.type === type);
        const value = filter?.value ?? (type === 'grayscale' ? 0 : 100);
        
        return (
          <div key={type} className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-600 capitalize">{type}</label>
              <span className="text-xs text-gray-500">{value}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max={type === 'grayscale' ? '100' : '200'}
                value={value}
                onChange={(e) => updateFilter(type, Number(e.target.value))}
                className="flex-1"
              />
              {filter && (
                <button
                  onClick={() => removeFilter(type)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}





