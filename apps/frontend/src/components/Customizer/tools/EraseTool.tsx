'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eraser } from 'lucide-react';

/**
 * EraseTool - Eraser tool with size control
 */
export function EraseTool() {
  const [eraserSize, setEraserSize] = useState(10);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Eraser className="h-5 w-5" />
          <CardTitle>Eraser Tool</CardTitle>
        </div>
        <CardDescription>Erase parts of your design</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Eraser Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Eraser Size</Label>
            <span className="text-sm text-muted-foreground">{eraserSize}px</span>
          </div>
          <Slider
            value={[eraserSize]}
            onValueChange={([value]) => setEraserSize(value)}
            min={1}
            max={100}
            step={1}
          />
        </div>

        <div className="text-sm text-muted-foreground">
          Click and drag on the canvas to erase
        </div>
      </CardContent>
    </Card>
  );
}
