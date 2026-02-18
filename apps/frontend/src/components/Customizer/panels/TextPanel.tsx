'use client';

import { useState } from 'react';
import { Type, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ColorPickerTool } from '../tools/ColorPickerTool';
import { useText } from '@/hooks/customizer/useText';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * TextPanel - Text configuration panel
 */
export function TextPanel() {
  const { toast } = useToast();
  const { addText, loadFont } = useText();
  
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(24);
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('normal');
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal');
  const [textDecoration, setTextDecoration] = useState<'none' | 'underline' | 'line-through'>('none');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [lineHeight, setLineHeight] = useState(1.5);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [color, setColor] = useState('#000000');
  const [textShadow, setTextShadow] = useState(false);
  const [outline, setOutline] = useState(false);

  const systemFonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New',
    'Georgia', 'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS',
    'Tahoma', 'Palatino', 'Garamond', 'Bookman', 'Arial Black'
  ];

  const handleAddText = async () => {
    try {
      await loadFont(fontFamily);
      await addText('New Text', {
        fontFamily,
        fontSize,
        fontWeight: fontWeight === 'bold' ? 'bold' : 'normal',
        fontStyle,
        textDecoration,
        textAlign,
        color,
      });
      toast({
        title: 'Text added',
        description: 'Text has been added to the canvas',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add text',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          <CardTitle>Text</CardTitle>
        </div>
        <CardDescription>Configure text properties</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Font Family */}
        <div className="space-y-2">
          <Label>Font Family</Label>
          <Select value={fontFamily} onValueChange={setFontFamily}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {systemFonts.map((font) => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground" style={{ fontFamily }}>
            Preview: The quick brown fox
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Font Size</Label>
            <span className="text-sm text-muted-foreground">{fontSize}px</span>
          </div>
          <div className="flex gap-2">
            <Slider
              value={[fontSize]}
              onValueChange={([value]) => setFontSize(value)}
              min={8}
              max={200}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value) || 24)}
              className="w-20"
              min={8}
              max={200}
            />
          </div>
        </div>

        {/* Font Weight & Style */}
        <div className="space-y-2">
          <Label>Style</Label>
          <div className="flex gap-2">
            <Button
              variant={fontWeight === 'bold' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold')}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={fontStyle === 'italic' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant={textDecoration === 'underline' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setTextDecoration(textDecoration === 'underline' ? 'none' : 'underline')}
            >
              <Underline className="h-4 w-4" />
            </Button>
            <Button
              variant={textDecoration === 'line-through' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setTextDecoration(textDecoration === 'line-through' ? 'none' : 'line-through')}
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Text Alignment */}
        <div className="space-y-2">
          <Label>Alignment</Label>
          <div className="flex gap-2">
            <Button
              variant={textAlign === 'left' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setTextAlign('left')}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={textAlign === 'center' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setTextAlign('center')}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant={textAlign === 'right' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setTextAlign('right')}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              variant={textAlign === 'justify' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setTextAlign('justify')}
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Line Height */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Line Height</Label>
            <span className="text-sm text-muted-foreground">{lineHeight.toFixed(1)}</span>
          </div>
          <Slider
            value={[lineHeight]}
            onValueChange={([value]) => setLineHeight(value)}
            min={0.5}
            max={3}
            step={0.1}
          />
        </div>

        {/* Letter Spacing */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Letter Spacing</Label>
            <span className="text-sm text-muted-foreground">{letterSpacing}px</span>
          </div>
          <Slider
            value={[letterSpacing]}
            onValueChange={([value]) => setLetterSpacing(value)}
            min={-5}
            max={20}
            step={0.5}
          />
        </div>

        <Separator />

        {/* Color */}
        <div className="space-y-2">
          <Label>Color</Label>
          <ColorPickerTool value={color} onChange={setColor} />
        </div>

        {/* Text Effects */}
        <div className="space-y-2">
          <Label>Effects</Label>
          <div className="flex gap-2">
            <Button
              variant={textShadow ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTextShadow(!textShadow)}
            >
              Shadow
            </Button>
            <Button
              variant={outline ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOutline(!outline)}
            >
              Outline
            </Button>
          </div>
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
