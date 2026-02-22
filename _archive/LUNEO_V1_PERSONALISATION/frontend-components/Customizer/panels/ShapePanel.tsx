'use client';

import { useState } from 'react';
import { Shapes, Square, Circle, Triangle, Star, Minus, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ColorPickerTool } from '../tools/ColorPickerTool';
import { cn } from '@/lib/utils';

type ShapeType = 'rect' | 'circle' | 'ellipse' | 'triangle' | 'star' | 'polygon' | 'line' | 'arrow';

interface ShapeOption {
  type: ShapeType;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const SHAPE_OPTIONS: ShapeOption[] = [
  { type: 'rect', icon: Square, label: 'Rectangle' },
  { type: 'circle', icon: Circle, label: 'Circle' },
  { type: 'ellipse', icon: Circle, label: 'Ellipse' },
  { type: 'triangle', icon: Triangle, label: 'Triangle' },
  { type: 'star', icon: Star, label: 'Star' },
  { type: 'polygon', icon: Shapes, label: 'Polygon' },
  { type: 'line', icon: Minus, label: 'Line' },
  { type: 'arrow', icon: ArrowRight, label: 'Arrow' },
];

/**
 * ShapePanel - Shape library panel
 */
export function ShapePanel() {
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rect');
  const [fillColor, setFillColor] = useState('#3B82F6');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [borderRadius, setBorderRadius] = useState(0);
  const [opacity, setOpacity] = useState(100);

  const handleAddShape = () => {
    // TODO: Add the shape to the canvas via layer store
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shapes className="h-5 w-5" />
          <CardTitle>Shapes</CardTitle>
        </div>
        <CardDescription>Add shapes to your design</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shape Grid */}
        <div className="space-y-2">
          <Label>Select Shape</Label>
          <div className="grid grid-cols-4 gap-2">
            {SHAPE_OPTIONS.map((shape) => {
              const Icon = shape.icon;
              return (
                <button
                  key={shape.type}
                  onClick={() => setSelectedShape(shape.type)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 p-3 rounded border transition-colors',
                    selectedShape === shape.type
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:bg-muted/50'
                  )}
                  title={shape.label}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs">{shape.label}</span>
                </button>
              );
            })}
          </div>
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
          <div className="flex gap-2">
            <Slider
              value={[strokeWidth]}
              onValueChange={([value]) => setStrokeWidth(value)}
              min={0}
              max={20}
              step={0.5}
              className="flex-1"
            />
            <Input
              type="number"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value) || 0)}
              className="w-20"
              min={0}
              max={20}
              step={0.5}
            />
          </div>
        </div>

        {/* Border Radius (for rectangles) */}
        {(selectedShape === 'rect' || selectedShape === 'polygon') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Border Radius</Label>
              <span className="text-sm text-muted-foreground">{borderRadius}px</span>
            </div>
            <div className="flex gap-2">
              <Slider
                value={[borderRadius]}
                onValueChange={([value]) => setBorderRadius(value)}
                min={0}
                max={50}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={borderRadius}
                onChange={(e) => setBorderRadius(Number(e.target.value) || 0)}
                className="w-20"
                min={0}
                max={50}
              />
            </div>
          </div>
        )}

        {/* Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Opacity</Label>
            <span className="text-sm text-muted-foreground">{opacity}%</span>
          </div>
          <Slider
            value={[opacity]}
            onValueChange={([value]) => setOpacity(value)}
            min={0}
            max={100}
            step={1}
          />
        </div>

        <Separator />

        {/* Add Shape Button */}
        <Button onClick={handleAddShape} className="w-full">
          Add Shape
        </Button>
      </CardContent>
    </Card>
  );
}
