'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shapes } from 'lucide-react';
import { useTool } from '@/hooks/customizer';
import { useLayersStore } from '@/stores/customizer';
import { ColorPickerTool } from './ColorPickerTool';
import type { LayerType } from '@/stores/customizer';

const shapeTypes: Array<{ value: LayerType; label: string }> = [
  { value: 'rect', label: 'Rectangle' },
  { value: 'circle', label: 'Circle' },
  { value: 'ellipse', label: 'Ellipse' },
  { value: 'star', label: 'Star' },
  { value: 'line', label: 'Line' },
  { value: 'arrow', label: 'Arrow' },
];

/**
 * ShapeTool - Shape tool panel with type selector and styling options
 */
export function ShapeTool() {
  const [shapeType, setShapeType] = useState<LayerType>('rect');
  const [fillColor, setFillColor] = useState('#3B82F6');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [cornerRadius, setCornerRadius] = useState(0);
  const { setActiveTool } = useTool();
  const { addLayer } = useLayersStore();

  const handleAddShape = () => {
    addLayer({
      id: crypto.randomUUID(),
      name: `${shapeType} shape`,
      type: shapeType,
      isVisible: true,
      isLocked: false,
      isSelected: false,
      sortOrder: 0,
      opacity: 1,
      metadata: { fillColor, strokeColor, strokeWidth, cornerRadius },
    });
    setActiveTool('select');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shapes className="h-5 w-5" />
          <CardTitle>Shape Tool</CardTitle>
        </div>
        <CardDescription>Add shapes to your design</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shape Type */}
        <div className="space-y-2">
          <Label>Shape Type</Label>
          <Select value={shapeType} onValueChange={(value) => setShapeType(value as LayerType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {shapeTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Fill Color */}
        <div className="space-y-2">
          <Label>Fill Color</Label>
          <ColorPickerTool value={fillColor} onChange={setFillColor} />
        </div>

        {/* Stroke Color */}
        <div className="space-y-2">
          <Label>Stroke Color</Label>
          <ColorPickerTool value={strokeColor} onChange={setStrokeColor} />
        </div>

        {/* Stroke Width */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Stroke Width</Label>
            <span className="text-sm text-muted-foreground">{strokeWidth}px</span>
          </div>
          <Slider
            value={[strokeWidth]}
            onValueChange={([value]) => setStrokeWidth(value)}
            min={0}
            max={20}
            step={1}
          />
        </div>

        {/* Corner Radius (for rectangles) */}
        {shapeType === 'rect' && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Corner Radius</Label>
                <span className="text-sm text-muted-foreground">{cornerRadius}px</span>
              </div>
              <Slider
                value={[cornerRadius]}
                onValueChange={([value]) => setCornerRadius(value)}
                min={0}
                max={50}
                step={1}
              />
            </div>
          </>
        )}

        <Separator />

        {/* Add Shape Button */}
        <Button onClick={handleAddShape} className="w-full">
          Add Shape
        </Button>
      </CardContent>
    </Card>
  );
}
