'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { QrCode } from 'lucide-react';
import { ColorPickerTool } from './ColorPickerTool';
import { Switch } from '@/components/ui/switch';
import dynamic from 'next/dynamic';

// Dynamic import for QR code library (SSR-safe)
const QRCodeSVG = dynamic(() => import('qrcode.react').then((mod) => mod.QRCodeSVG), {
  ssr: false,
});

/**
 * QRCodeTool - QR code generator tool
 */
export function QRCodeTool() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(200);
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [hasBackground, setHasBackground] = useState(true);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');

  const handleGenerate = () => {
    // TODO: Add QR code to canvas
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          <CardTitle>QR Code Tool</CardTitle>
        </div>
        <CardDescription>Generate QR codes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Text/URL Input */}
        <div className="space-y-2">
          <Label>Text or URL</Label>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text or URL"
          />
        </div>

        {/* Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Size</Label>
            <span className="text-sm text-muted-foreground">{size}px</span>
          </div>
          <Slider
            value={[size]}
            onValueChange={([value]) => setSize(value)}
            min={50}
            max={500}
            step={10}
          />
        </div>

        <Separator />

        {/* Foreground Color */}
        <div className="space-y-2">
          <Label>Foreground Color</Label>
          <ColorPickerTool value={foregroundColor} onChange={setForegroundColor} />
        </div>

        {/* Background Color Toggle */}
        <div className="flex items-center justify-between">
          <Label>Background Color</Label>
          <Switch checked={hasBackground} onCheckedChange={setHasBackground} />
        </div>

        {hasBackground && (
          <div className="space-y-2">
            <ColorPickerTool value={backgroundColor} onChange={setBackgroundColor} />
          </div>
        )}

        {/* Error Correction Level */}
        <div className="space-y-2">
          <Label>Error Correction Level</Label>
          <Select
            value={errorCorrectionLevel}
            onValueChange={(value) => setErrorCorrectionLevel(value as 'L' | 'M' | 'Q' | 'H')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="L">Low (~7%)</SelectItem>
              <SelectItem value="M">Medium (~15%)</SelectItem>
              <SelectItem value="Q">Quartile (~25%)</SelectItem>
              <SelectItem value="H">High (~30%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preview */}
        {text && (
          <>
            <Separator />
            <div className="flex items-center justify-center rounded border bg-background p-4">
              <QRCodeSVG
                value={text}
                size={Math.min(size, 200)}
                fgColor={foregroundColor}
                bgColor={hasBackground ? backgroundColor : 'transparent'}
                level={errorCorrectionLevel}
              />
            </div>
          </>
        )}

        <Separator />

        {/* Generate Button */}
        <Button onClick={handleGenerate} className="w-full" disabled={!text.trim()}>
          Generate QR Code
        </Button>
      </CardContent>
    </Card>
  );
}
