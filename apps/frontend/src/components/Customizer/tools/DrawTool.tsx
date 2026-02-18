'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Pencil } from 'lucide-react';
import { useTool } from '@/hooks/customizer';
import { ColorPickerTool } from './ColorPickerTool';

/**
 * DrawTool - Drawing tool with brush settings
 */
export function DrawTool() {
  const [brushSize, setBrushSize] = useState(5);
  const [color, setColor] = useState('#000000');
  const [opacity, setOpacity] = useState(100);
  const { setActiveTool } = useTool();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Pencil className="h-5 w-5" />
          <CardTitle>Draw Tool</CardTitle>
        </div>
        <CardDescription>Free draw on the canvas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Brush Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Brush Size</Label>
            <span className="text-sm text-muted-foreground">{brushSize}px</span>
          </div>
          <Slider
            value={[brushSize]}
            onValueChange={([value]) => setBrushSize(value)}
            min={1}
            max={50}
            step={1}
          />
        </div>

        <Separator />

        {/* Color */}
        <div className="space-y-2">
          <Label>Color</Label>
          <ColorPickerTool value={color} onChange={setColor} />
        </div>

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

        <div className="text-sm text-muted-foreground">
          Click and drag on the canvas to draw
        </div>
      </CardContent>
    </Card>
  );
}
