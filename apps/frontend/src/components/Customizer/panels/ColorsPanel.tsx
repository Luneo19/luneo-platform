'use client';

import { useState } from 'react';
import { Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPickerTool } from '../tools/ColorPickerTool';
import { cn } from '@/lib/utils';

// Material Design color palette
const MATERIAL_COLORS = {
  Red: ['#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C'],
  Pink: ['#FCE4EC', '#F8BBD0', '#F48FB1', '#F06292', '#EC407A', '#E91E63', '#D81B60', '#C2185B', '#AD1457', '#880E4F'],
  Purple: ['#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C'],
  DeepPurple: ['#EDE7F6', '#D1C4E9', '#B39DDB', '#9575CD', '#7E57C2', '#673AB7', '#5E35B1', '#512DA8', '#4527A0', '#311B92'],
  Indigo: ['#E8EAF6', '#C5CAE9', '#9FA8DA', '#7986CB', '#5C6BC0', '#3F51B5', '#3949AB', '#303F9F', '#283593', '#1A237E'],
  Blue: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1'],
  LightBlue: ['#E1F5FE', '#B3E5FC', '#81D4FA', '#4FC3F7', '#29B6F6', '#03A9F4', '#039BE5', '#0288D1', '#0277BD', '#01579B'],
  Cyan: ['#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA', '#00BCD4', '#00ACC1', '#0097A7', '#00838F', '#006064'],
  Teal: ['#E0F2F1', '#B2DFDB', '#80CBC4', '#4DB6AC', '#26A69A', '#009688', '#00897B', '#00796B', '#00695C', '#004D40'],
  Green: ['#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20'],
  LightGreen: ['#F1F8E9', '#DCEDC8', '#C5E1A5', '#AED581', '#9CCC65', '#8BC34A', '#7CB342', '#689F38', '#558B2F', '#33691E'],
  Lime: ['#F9FBE7', '#F0F4C3', '#E6EE9C', '#DCE775', '#D4E157', '#CDDC39', '#C0CA33', '#AFB42B', '#9E9D24', '#827717'],
  Yellow: ['#FFFDE7', '#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58', '#FFEB3B', '#FDD835', '#FBC02D', '#F9A825', '#F57F17'],
  Amber: ['#FFF8E1', '#FFECB3', '#FFE082', '#FFD54F', '#FFCA28', '#FFC107', '#FFB300', '#FFA000', '#FF8F00', '#FF6F00'],
  Orange: ['#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#EF6C00', '#E65100'],
  DeepOrange: ['#FBE9E7', '#FFCCBC', '#FFAB91', '#FF8A65', '#FF7043', '#FF5722', '#F4511E', '#E64A19', '#D84315', '#BF360C'],
  Brown: ['#EFEBE9', '#D7CCC8', '#BCAAA4', '#A1887F', '#8D6E63', '#795548', '#6D4C41', '#5D4037', '#4E342E', '#3E2723'],
  Grey: ['#FAFAFA', '#F5F5F5', '#EEEEEE', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#212121'],
  BlueGrey: ['#ECEFF1', '#CFD8DC', '#B0BEC5', '#90A4AE', '#78909C', '#607D8B', '#546E7A', '#455A64', '#37474F', '#263238'],
};

const GRADIENT_PRESETS = [
  { name: 'Sunset', colors: ['#FF6B6B', '#FFE66D'] },
  { name: 'Ocean', colors: ['#4ECDC4', '#44A08D'] },
  { name: 'Purple Dream', colors: ['#A8EDEA', '#FED6E3'] },
  { name: 'Forest', colors: ['#134E5E', '#71B280'] },
  { name: 'Fire', colors: ['#FF512F', '#DD2476'] },
  { name: 'Cool Blue', colors: ['#2193B0', '#6DD5ED'] },
];

/**
 * ColorsPanel - Color palette panel
 */
export function ColorsPanel() {
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [hexInput, setHexInput] = useState('#000000');
  const [rgbInput, setRgbInput] = useState({ r: 0, g: 0, b: 0 });

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setHexInput(color);
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c !== color);
      return [color, ...filtered.slice(0, 9)];
    });
  };

  const handleHexChange = (hex: string) => {
    setHexInput(hex);
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      handleColorSelect(hex);
    }
  };

  const handleRgbChange = (component: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgbInput, [component]: value };
    setRgbInput(newRgb);
    const hex = `#${[newRgb.r, newRgb.g, newRgb.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    handleColorSelect(hex);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          <CardTitle>Colors</CardTitle>
        </div>
        <CardDescription>Color palette and picker</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="swatches" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="swatches">Swatches</TabsTrigger>
            <TabsTrigger value="gradients">Gradients</TabsTrigger>
          </TabsList>

          <TabsContent value="swatches" className="space-y-4">
            {/* Color Picker */}
            <div className="space-y-2">
              <Label>Color Picker</Label>
              <ColorPickerTool value={selectedColor} onChange={handleColorSelect} />
            </div>

            {/* Hex/RGB Input */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Hex</Label>
                <Input
                  value={hexInput}
                  onChange={(e) => handleHexChange(e.target.value)}
                  placeholder="#000000"
                  maxLength={7}
                />
              </div>
              <div className="space-y-2">
                <Label>RGB</Label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    value={rgbInput.r}
                    onChange={(e) => handleRgbChange('r', Number(e.target.value) || 0)}
                    placeholder="R"
                    min={0}
                    max={255}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    value={rgbInput.g}
                    onChange={(e) => handleRgbChange('g', Number(e.target.value) || 0)}
                    placeholder="G"
                    min={0}
                    max={255}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    value={rgbInput.b}
                    onChange={(e) => handleRgbChange('b', Number(e.target.value) || 0)}
                    placeholder="B"
                    min={0}
                    max={255}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Recent Colors */}
            {recentColors.length > 0 && (
              <div className="space-y-2">
                <Label>Recent Colors</Label>
                <div className="grid grid-cols-10 gap-1">
                  {recentColors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => handleColorSelect(color)}
                      className={cn(
                        'aspect-square rounded border-2 transition-all',
                        selectedColor === color ? 'border-primary scale-110' : 'border-muted'
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Material Design Colors */}
            <div className="space-y-3">
              <Label>Material Design Colors</Label>
              {Object.entries(MATERIAL_COLORS).map(([category, colors]) => (
                <div key={category} className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{category}</p>
                  <div className="grid grid-cols-10 gap-1">
                    {colors.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => handleColorSelect(color)}
                        className={cn(
                          'aspect-square rounded border transition-all hover:scale-110',
                          selectedColor === color ? 'border-primary scale-110' : 'border-muted/50'
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gradients" className="space-y-4">
            <div className="space-y-2">
              <Label>Gradient Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                {GRADIENT_PRESETS.map((gradient) => (
                  <button
                    key={gradient.name}
                    className="h-16 rounded border overflow-hidden relative group"
                    style={{
                      background: `linear-gradient(135deg, ${gradient.colors[0]}, ${gradient.colors[1]})`,
                    }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                      {gradient.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gradient Type</Label>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  Linear
                </Button>
                <Button variant="outline" className="flex-1">
                  Radial
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
