'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Palette, Droplets, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ColorPickerProps {
  selectedColor?: string;
  onColorChange: (color: string) => void;
  className?: string;
  showPresets?: boolean;
  showCustom?: boolean;
  showGradients?: boolean;
}

// Color presets organized by category
const COLOR_PRESETS = {
  'Basic': [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#C0C0C0',
  ],
  'Red': [
    '#FF6B6B', '#FF5252', '#F44336', '#E53935', '#D32F2F',
    '#C62828', '#B71C1C', '#FFCDD2', '#FFEBEE', '#FF1744',
  ],
  'Orange': [
    '#FFB74D', '#FF9800', '#FF8F00', '#FF6F00', '#E65100',
    '#FF5722', '#FF3D00', '#FFE0B2', '#FFF3E0', '#FF6F00',
  ],
  'Yellow': [
    '#FFEB3B', '#FFC107', '#FFB300', '#FF8F00', '#F57F17',
    '#FFD54F', '#FFF176', '#FFFDE7', '#FFF8E1', '#FFC107',
  ],
  'Green': [
    '#4CAF50', '#8BC34A', '#CDDC39', '#9CCC65', '#AED581',
    '#C8E6C9', '#E8F5E8', '#2E7D32', '#388E3C', '#43A047',
  ],
  'Blue': [
    '#2196F3', '#1976D2', '#1565C0', '#0D47A1', '#1E88E5',
    '#42A5F5', '#64B5F6', '#90CAF9', '#BBDEFB', '#E3F2FD',
  ],
  'Purple': [
    '#9C27B0', '#7B1FA2', '#6A1B9A', '#4A148C', '#8E24AA',
    '#AB47BC', '#BA68C8', '#CE93D8', '#E1BEE7', '#F3E5F5',
  ],
  'Pink': [
    '#E91E63', '#C2185B', '#AD1457', '#880E4F', '#F06292',
    '#F48FB1', '#F8BBD9', '#FCE4EC', '#F3E5F5', '#E91E63',
  ],
  'Brown': [
    '#795548', '#6D4C41', '#5D4037', '#4E342E', '#3E2723',
    '#8D6E63', '#A1887F', '#BCAAA4', '#D7CCC8', '#EFEBE9',
  ],
  'Gray': [
    '#9E9E9E', '#757575', '#616161', '#424242', '#212121',
    '#BDBDBD', '#E0E0E0', '#EEEEEE', '#F5F5F5', '#FAFAFA',
  ],
};

// Gradient presets
const GRADIENT_PRESETS = [
  'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
  'linear-gradient(45deg, #A8E6CF, #FFD93D)',
  'linear-gradient(45deg, #FF9A9E, #FECFEF)',
  'linear-gradient(45deg, #A8EDEA, #FED6E3)',
  'linear-gradient(45deg, #D299C2, #FED6E3)',
  'linear-gradient(45deg, #667eea, #764ba2)',
  'linear-gradient(45deg, #f093fb, #f5576c)',
  'linear-gradient(45deg, #4facfe, #00f2fe)',
  'linear-gradient(45deg, #43e97b, #38f9d7)',
  'linear-gradient(45deg, #fa709a, #fee140)',
  'linear-gradient(45deg, #a8edea, #fed6e3)',
  'linear-gradient(45deg, #ff9a9e, #fecfef)',
  'linear-gradient(45deg, #ffecd2, #fcb69f)',
  'linear-gradient(45deg, #ff8a80, #ff80ab)',
  'linear-gradient(45deg, #84fab0, #8fd3f4)',
  'linear-gradient(45deg, #a6c0fe, #f68084)',
  'linear-gradient(45deg, #ff9a9e, #fad0c4)',
  'linear-gradient(45deg, #ffecd2, #fcb69f)',
  'linear-gradient(45deg, #a8edea, #fed6e3)',
  'linear-gradient(45deg, #d299c2, #fef9d7)',
];

export default function ColorPicker({
  selectedColor = '#000000',
  onColorChange,
  className = '',
  showPresets = true,
  showCustom = true,
  showGradients = true,
}: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(selectedColor);
  const [isOpen, setIsOpen] = useState(false);

  const tabConfig = useMemo(() => {
    const entries: Array<{ id: 'presets' | 'custom' | 'gradients'; label: string; icon: LucideIcon }> = [];
    if (showPresets) {
      entries.push({ id: 'presets', label: 'Presets', icon: Palette });
    }
    if (showCustom) {
      entries.push({ id: 'custom', label: 'Custom', icon: Droplets });
    }
    if (showGradients) {
      entries.push({ id: 'gradients', label: 'Gradients', icon: Sparkles });
    }
    return entries;
  }, [showPresets, showCustom, showGradients]);

  const defaultTab = tabConfig[0]?.id ?? 'custom';
  const gridClass =
    tabConfig.length <= 1 ? 'grid-cols-1' : tabConfig.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  const handleColorSelect = useCallback((color: string) => {
    onColorChange(color);
    setCustomColor(color);
    setIsOpen(false);
  }, [onColorChange]);

  const handleCustomColorChange = useCallback((color: string) => {
    setCustomColor(color);
    onColorChange(color);
  }, [onColorChange]);

  const isValidHex = (hex: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  };

  return (
    <div className={`w-full ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start h-10"
          >
            <div
              className="w-4 h-4 rounded border border-gray-300 mr-2"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="text-sm">{selectedColor.toUpperCase()}</span>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" align="start">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className={`grid w-full ${gridClass}`}>
              {tabConfig.map(({ id, label, icon: Icon }) => (
                <TabsTrigger key={id} value={id} className="text-xs flex items-center gap-1">
                  <Icon className="w-3 h-3" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {showPresets && (
              <TabsContent value="presets" className="p-4">
                <div className="space-y-4">
                  {Object.entries(COLOR_PRESETS).map(([category, colors]) => (
                    <div key={category}>
                      <Label className="text-xs font-medium text-gray-600 mb-2 block">
                        {category}
                      </Label>
                      <div className="grid grid-cols-5 gap-2">
                        {colors.map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                              selectedColor === color
                                ? 'border-blue-500 ring-2 ring-blue-200'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleColorSelect(color)}
                            title={color}
                          >
                            {selectedColor === color && (
                              <Check className="w-4 h-4 text-white m-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}

            {showCustom && (
            <TabsContent value="custom" className="p-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="color-input" className="text-sm font-medium">
                    Hex Color
                  </Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="color-input"
                      value={customColor}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.startsWith('#') && isValidHex(value)) {
                          handleCustomColorChange(value);
                        } else if (!value.startsWith('#')) {
                          handleCustomColorChange('#' + value);
                        }
                      }}
                      placeholder="#000000"
                      className="flex-1"
                    />
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: customColor }}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Color Picker
                  </Label>
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="w-full h-10 rounded border border-gray-300 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleColorSelect(customColor)}
                    disabled={!isValidHex(customColor)}
                  >
                    Apply Color
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomColor(selectedColor);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </TabsContent>
            )}

            {showGradients && (
            <TabsContent value="gradients" className="p-4">
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Gradient Presets
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {GRADIENT_PRESETS.map((gradient, index) => (
                    <button
                      key={index}
                      className={`w-full h-12 rounded border-2 transition-all hover:scale-105 ${
                        selectedColor === gradient
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ background: gradient }}
                      onClick={() => handleColorSelect(gradient)}
                      title={gradient}
                    >
                      {selectedColor === gradient && (
                        <Check className="w-4 h-4 text-white m-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>
            )}
          </Tabs>
        </PopoverContent>
      </Popover>

      {/* Recent Colors */}
      <div className="mt-4">
        <Label className="text-xs font-medium text-gray-600 mb-2 block">
          Recent Colors
        </Label>
        <div className="flex space-x-2">
          {[selectedColor].map((color, index) => (
            <button
              key={index}
              className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelect(color)}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Color Info */}
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
        <div>Selected: {selectedColor}</div>
        {selectedColor.startsWith('linear-gradient') && (
          <div className="mt-1 text-gray-500">Gradient</div>
        )}
      </div>
    </div>
  );
}
