'use client';

import { useState } from 'react';
import { PRESET_COLORS } from '../../../constants/colors';
import { isValidHexColor } from '../../../utils/color.utils';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value);
  const [showCustom, setShowCustom] = useState(false);
  
  const handlePresetClick = (color: string) => {
    onChange(color);
    setShowCustom(false);
  };
  
  const handleCustomChange = (hex: string) => {
    setCustomColor(hex);
    if (isValidHexColor(hex)) {
      onChange(hex);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div
          className="w-10 h-10 rounded border-2 border-gray-300 cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => setShowCustom(!showCustom)}
        />
        <input
          type="text"
          value={customColor}
          onChange={(e) => handleCustomChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="space-y-2">
        <div>
          <p className="text-xs text-gray-600 mb-1">Couleurs de base</p>
          <div className="grid grid-cols-6 gap-1">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handlePresetClick(color)}
                className={`w-8 h-8 rounded border-2 transition-transform ${
                  value === color ? 'border-blue-500 scale-110' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

