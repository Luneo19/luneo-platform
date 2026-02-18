'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ColorPickerToolProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#000080', '#008000',
];

/**
 * ColorPickerTool - Color picker with hue/saturation, lightness, hex input, and presets
 */
export function ColorPickerTool({ value, onChange, label }: ColorPickerToolProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value);

  // Convert hex to HSL for sliders
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const { h, s, l } = hexToHsl(value);

  const handleHueChange = ([newH]: number[]) => {
    const newHex = hslToHex(newH, s, l);
    onChange(newHex);
    setHexInput(newHex);
  };

  const handleSaturationChange = ([newS]: number[]) => {
    const newHex = hslToHex(h, newS, l);
    onChange(newHex);
    setHexInput(newHex);
  };

  const handleLightnessChange = ([newL]: number[]) => {
    const newHex = hslToHex(h, s, newL);
    onChange(newHex);
    setHexInput(newHex);
  };

  const handleHexChange = (newHex: string) => {
    setHexInput(newHex);
    if (/^#[0-9A-F]{6}$/i.test(newHex)) {
      onChange(newHex);
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start"
            style={{ backgroundColor: value }}
          >
            <div
              className="mr-2 h-4 w-4 rounded border"
              style={{ backgroundColor: value }}
            />
            {value}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-4">
            {/* Hue/Saturation Square */}
            <div className="space-y-2">
              <Label>Hue & Saturation</Label>
              <div className="relative h-32 w-full rounded border">
                {/* Simplified color square - in production, use a proper color picker library */}
                <div
                  className="h-full w-full rounded"
                  style={{
                    background: `linear-gradient(to right, hsl(${h}, 100%, 50%), hsl(${h}, 0%, 50%)), linear-gradient(to bottom, transparent, black)`,
                  }}
                />
              </div>
            </div>

            {/* Hue Slider */}
            <div className="space-y-2">
              <Label>Hue</Label>
              <Slider value={[h]} onValueChange={handleHueChange} min={0} max={360} step={1} />
            </div>

            {/* Saturation Slider */}
            <div className="space-y-2">
              <Label>Saturation</Label>
              <Slider value={[s]} onValueChange={handleSaturationChange} min={0} max={100} step={1} />
            </div>

            {/* Lightness Slider */}
            <div className="space-y-2">
              <Label>Lightness</Label>
              <Slider value={[l]} onValueChange={handleLightnessChange} min={0} max={100} step={1} />
            </div>

            {/* Hex Input */}
            <div className="space-y-2">
              <Label>Hex</Label>
              <Input
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#000000"
                maxLength={7}
              />
            </div>

            {/* Preset Colors */}
            <div className="space-y-2">
              <Label>Presets</Label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      onChange(color);
                      setHexInput(color);
                    }}
                    className={cn(
                      'h-8 w-full rounded border-2 transition-all',
                      value === color ? 'border-primary' : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
