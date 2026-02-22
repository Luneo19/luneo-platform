'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Palette, Sparkles, Droplet, Star, Search } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface ColorOption {
  id: string;
  name: string;
  hex: string;
  category: string;
  metallic?: boolean;
  popular?: boolean;
}

interface ColorPalette3DProps {
  colors: ColorOption[];
  selectedColor?: string;
  onColorSelect: (color: string) => void;
  showPreview?: boolean;
  className?: string;
}

const COLOR_CATEGORIES = [
  { id: 'all', name: 'All Colors', icon: '🎨' },
  { id: 'basic', name: 'Basic', icon: '⚫' },
  { id: 'metallic', name: 'Metallic', icon: '✨' },
  { id: 'pastel', name: 'Pastel', icon: '🌸' },
  { id: 'vibrant', name: 'Vibrant', icon: '🌈' },
  { id: 'neutral', name: 'Neutral', icon: '⚪' },
];

const PRESET_PALETTES = {
  'Monochrome': ['#000000', '#404040', '#808080', '#C0C0C0', '#FFFFFF'],
  'Ocean': ['#001f3f', '#0074D9', '#7FDBFF', '#39CCCC', '#3D9970'],
  'Sunset': ['#FF4136', '#FF851B', '#FFDC00', '#F012BE', '#B10DC9'],
  'Forest': ['#2ECC40', '#3D9970', '#01FF70', '#85C1E2', '#39CCCC'],
  'Pastel': ['#FFB6C1', '#E6E6FA', '#98FB98', '#87CEEB', '#FFCCCB'],
  'Metallic': ['#FFD700', '#C0C0C0', '#B87333', '#E5E4E2', '#CD7F32'],
};

function ColorPalette3DContent({
  colors,
  selectedColor = '#000000',
  onColorSelect,
  showPreview = true,
  className = '',
}: ColorPalette3DProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customColor, setCustomColor] = useState(selectedColor);
  const [recentColors, setRecentColors] = useState<string[]>([selectedColor]);

  const filteredColors = useMemo(() => {
    let filtered = colors;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [colors, selectedCategory, searchTerm]);

  const popularColors = useMemo(() => {
    return colors.filter(c => c.popular);
  }, [colors]);

  const isValidHex = useCallback((hex: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  }, []);

  const handleColorSelect = useCallback((color: string) => {
    onColorSelect(color);
    
    // Add to recent colors
    setRecentColors(prev => {
      const updated = [color, ...prev.filter(c => c !== color)].slice(0, 10);
      return updated;
    });
  }, [onColorSelect]);

  const handleCustomColorApply = useCallback(() => {
    if (isValidHex(customColor)) {
      handleColorSelect(customColor);
    }
  }, [customColor, isValidHex, handleColorSelect]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleCustomColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value);
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <Tabs defaultValue="presets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="presets">
            <Palette className="w-3 h-3 mr-1" />
            Presets
          </TabsTrigger>
          <TabsTrigger value="palettes">
            <Sparkles className="w-3 h-3 mr-1" />
            Palettes
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Droplet className="w-3 h-3 mr-1" />
            Custom
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search colors..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {COLOR_CATEGORIES.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleCategoryChange(category.id)}
              >
                <span className="mr-1">{category.icon}</span>
                {category.name}
              </Badge>
            ))}
          </div>

          {/* Popular Colors */}
          {!searchTerm && selectedCategory === 'all' && popularColors.length > 0 && (
            <div>
              <div className="flex items-center mb-2">
                <Star className="w-4 h-4 text-yellow-500 mr-2" />
                <Label className="text-sm font-semibold">Popular Colors</Label>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {popularColors.slice(0, 10).map((color) => (
                  <ColorButton
                    key={color.id}
                    color={color.hex}
                    name={color.name}
                    selected={selectedColor === color.hex}
                    metallic={color.metallic}
                    onSelect={() => handleColorSelect(color.hex)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Colors */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              {selectedCategory === 'all' ? 'All Colors' : COLOR_CATEGORIES.find(c => c.id === selectedCategory)?.name}
              <span className="text-gray-500 font-normal ml-2">({filteredColors.length})</span>
            </Label>
            <ScrollArea className="h-64">
              <div className="grid grid-cols-5 gap-2 pr-4">
                {filteredColors.map((color) => (
                  <ColorButton
                    key={color.id}
                    color={color.hex}
                    name={color.name}
                    selected={selectedColor === color.hex}
                    metallic={color.metallic}
                    onSelect={() => handleColorSelect(color.hex)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="palettes" className="space-y-4">
          <Label className="text-sm font-semibold">Color Palettes</Label>
          <div className="space-y-3">
            {Object.entries(PRESET_PALETTES).map(([name, palette]) => (
              <Card key={name} className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{name}</span>
                  <Badge variant="outline" className="text-xs">{palette.length} colors</Badge>
                </div>
                <div className="flex space-x-1">
                  {palette.map((color, index) => (
                    <button
                      key={index}
                      className="flex-1 h-8 rounded transition-transform hover:scale-110"
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorSelect(color)}
                      title={color}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Custom Color</Label>
            <div className="space-y-3">
              <div>
                <Label htmlFor="hex-input" className="text-xs text-gray-600">Hex Code</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id="hex-input"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    placeholder="#000000"
                    className="flex-1"
                  />
                  <div
                    className="w-10 h-10 rounded border border-gray-300"
                    style={{ backgroundColor: customColor }}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-600 mb-2 block">Color Picker</Label>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-full h-12 rounded border border-gray-300 cursor-pointer"
                />
              </div>

              <Button
                onClick={handleCustomColorApply}
                disabled={!isValidHex(customColor)}
                className="w-full"
              >
                Apply Color
              </Button>
            </div>
          </div>

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">Recent Colors</Label>
              <div className="grid grid-cols-5 gap-2">
                {recentColors.map((color, index) => (
                  <ColorButton
                    key={index}
                    color={color}
                    selected={selectedColor === color}
                    onSelect={() => handleColorSelect(color)}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Selected Color Preview */}
      {showPreview && (
        <Card className="mt-4 p-4 bg-gray-50">
          <Label className="text-xs text-gray-600 mb-2 block">Selected Color</Label>
          <div className="flex items-center space-x-3">
            <div
              className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm"
              style={{ backgroundColor: selectedColor }}
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">{selectedColor}</div>
              <div className="text-xs text-gray-500 mt-1">
                {colors.find(c => c.hex === selectedColor)?.name || 'Custom Color'}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

const ColorPalette3DContentMemo = memo(ColorPalette3DContent);

export default function ColorPalette3D(props: ColorPalette3DProps) {
  return (
    <ErrorBoundary componentName="ColorPalette3D">
      <ColorPalette3DContentMemo {...props} />
    </ErrorBoundary>
  );
}

interface ColorButtonProps {
  color: string;
  name?: string;
  selected?: boolean;
  metallic?: boolean;
  onSelect: () => void;
}

function ColorButton({ color, name, selected, metallic, onSelect }: ColorButtonProps) {
  return (
    <button
      className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 relative ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-gray-300 hover:border-gray-400'
      }`}
      style={{
        backgroundColor: color,
        background: metallic
          ? `linear-gradient(135deg, ${color} 0%, ${color}dd 50%, ${color} 100%)`
          : color,
      }}
      onClick={onSelect}
      title={name || color}
    >
      {selected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Check className="w-4 h-4 text-white drop-shadow-lg" style={{
            filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))',
          }} />
        </div>
      )}
      {metallic && (
        <Sparkles className="absolute bottom-0.5 right-0.5 w-3 h-3 text-white/70" />
      )}
    </button>
  );
}
