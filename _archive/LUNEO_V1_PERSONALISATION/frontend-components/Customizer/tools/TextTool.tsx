'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Type, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useTool } from '@/hooks/customizer';
import { useText } from '@/hooks/customizer';
import { useFonts } from '@/hooks/customizer';
import { useLayersStore } from '@/stores/customizer';
import { ColorPickerTool } from './ColorPickerTool';
import { logger } from '@/lib/logger';

/**
 * TextTool - Text tool panel with font, size, style, alignment options
 */
export function TextTool() {
  const { activeTool, setActiveTool } = useTool();
  const { addText } = useText();
  const { fonts, isLoading: fontsLoading } = useFonts();
  const { addLayer } = useLayersStore();
  const {
    currentFontFamily,
    currentFontSize,
    setFontFamily,
    setFontSize,
  } = useTool();

  const [fontStyle, setFontStyle] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  });
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left');
  const [color, setColor] = useState('#000000');

  const handleAddText = async () => {
    try {
      await addText('New Text', {
        fontFamily: currentFontFamily,
        fontSize: currentFontSize,
        color,
        fontStyle: fontStyle.italic ? 'italic' : 'normal',
        fontWeight: fontStyle.bold ? 'bold' : 'normal',
        textDecoration: fontStyle.underline ? 'underline' : fontStyle.strikethrough ? 'line-through' : 'none',
        textAlign: alignment,
      });
    } catch (error) {
      logger.error('Failed to add text', error instanceof Error ? error : new Error(String(error)));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          <CardTitle>Text Tool</CardTitle>
        </div>
        <CardDescription>Add and customize text</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Font Family */}
        <div className="space-y-2">
          <Label>Font Family</Label>
          <Select value={currentFontFamily} onValueChange={setFontFamily} disabled={fontsLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {fonts.map((font) => (
                <SelectItem key={font.family} value={font.family}>
                  <span style={{ fontFamily: font.family }}>{font.name || font.family}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Font Size</Label>
            <span className="text-sm text-muted-foreground">{currentFontSize}px</span>
          </div>
          <Slider
            value={[currentFontSize]}
            onValueChange={([value]) => setFontSize(value)}
            min={8}
            max={200}
            step={1}
          />
        </div>

        <Separator />

        {/* Font Style */}
        <div className="space-y-2">
          <Label>Style</Label>
          <div className="flex gap-1">
            <Button
              variant={fontStyle.bold ? 'default' : 'outline'}
              size="icon"
              onClick={() => setFontStyle({ ...fontStyle, bold: !fontStyle.bold })}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={fontStyle.italic ? 'default' : 'outline'}
              size="icon"
              onClick={() => setFontStyle({ ...fontStyle, italic: !fontStyle.italic })}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant={fontStyle.underline ? 'default' : 'outline'}
              size="icon"
              onClick={() => setFontStyle({ ...fontStyle, underline: !fontStyle.underline })}
            >
              <Underline className="h-4 w-4" />
            </Button>
            <Button
              variant={fontStyle.strikethrough ? 'default' : 'outline'}
              size="icon"
              onClick={() => setFontStyle({ ...fontStyle, strikethrough: !fontStyle.strikethrough })}
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Alignment */}
        <div className="space-y-2">
          <Label>Alignment</Label>
          <div className="flex gap-1">
            <Button
              variant={alignment === 'left' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setAlignment('left')}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={alignment === 'center' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setAlignment('center')}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant={alignment === 'right' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setAlignment('right')}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Color Picker */}
        <div className="space-y-2">
          <Label>Color</Label>
          <ColorPickerTool value={color} onChange={setColor} />
        </div>

        <Separator />

        {/* Add Text Button */}
        <Button onClick={handleAddText} className="w-full">
          Add Text
        </Button>
      </CardContent>
    </Card>
  );
}
