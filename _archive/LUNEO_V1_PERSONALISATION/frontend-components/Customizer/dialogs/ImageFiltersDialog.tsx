'use client';

import { useState } from 'react';
import { RotateCcw, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useImage } from '@/hooks/customizer/useImage';
import { useToast } from '@/hooks/use-toast';

interface ImageFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageId: string;
}

type FilterPreset = 'original' | 'grayscale' | 'sepia' | 'invert' | 'vintage' | 'warm' | 'cool';

const FILTER_PRESETS: Record<FilterPreset, { brightness: number; contrast: number; saturation: number; blur: number }> = {
  original: { brightness: 100, contrast: 100, saturation: 100, blur: 0 },
  grayscale: { brightness: 100, contrast: 100, saturation: 0, blur: 0 },
  sepia: { brightness: 100, contrast: 100, saturation: 50, blur: 0 },
  invert: { brightness: 100, contrast: 100, saturation: 100, blur: 0 },
  vintage: { brightness: 90, contrast: 110, saturation: 80, blur: 1 },
  warm: { brightness: 110, contrast: 100, saturation: 120, blur: 0 },
  cool: { brightness: 95, contrast: 100, saturation: 90, blur: 0 },
};

/**
 * ImageFiltersDialog - Image filter controls dialog
 */
export function ImageFiltersDialog({ open, onOpenChange, imageId }: ImageFiltersDialogProps) {
  const { toast } = useToast();
  const { applyFilter } = useImage();
  
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [opacity, setOpacity] = useState(100);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<FilterPreset>('original');

  const handlePresetSelect = (preset: FilterPreset) => {
    setSelectedPreset(preset);
    const values = FILTER_PRESETS[preset];
    setBrightness(values.brightness);
    setContrast(values.contrast);
    setSaturation(values.saturation);
    setBlur(values.blur);
  };

  const handleReset = () => {
    handlePresetSelect('original');
  };

  const handleApply = async () => {
    try {
      // Apply filters sequentially
      if (brightness !== 100) {
        await applyFilter(imageId, 'brightness', brightness);
      }
      if (contrast !== 100) {
        await applyFilter(imageId, 'contrast', contrast);
      }
      if (saturation !== 100) {
        await applyFilter(imageId, 'saturate', saturation);
      }
      if (blur > 0) {
        await applyFilter(imageId, 'blur', blur);
      }
      
      toast({
        title: 'Filters applied',
        description: 'Image filters have been applied',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to apply filters',
        variant: 'destructive',
      });
    }
  };

  const filterStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`,
    opacity: opacity / 100,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Image Filters</DialogTitle>
          <DialogDescription>
            Adjust image filters and effects
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preset Filters */}
          <div className="space-y-2">
            <Label>Preset Filters</Label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(FILTER_PRESETS) as FilterPreset[]).map((preset) => (
                <Button
                  key={preset}
                  variant={selectedPreset === preset ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetSelect(preset)}
                  className="capitalize"
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>

          {/* Brightness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Brightness</Label>
              <span className="text-sm text-muted-foreground">{brightness}%</span>
            </div>
            <Slider
              value={[brightness]}
              onValueChange={([value]) => setBrightness(value)}
              min={0}
              max={200}
              step={1}
            />
          </div>

          {/* Contrast */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Contrast</Label>
              <span className="text-sm text-muted-foreground">{contrast}%</span>
            </div>
            <Slider
              value={[contrast]}
              onValueChange={([value]) => setContrast(value)}
              min={0}
              max={200}
              step={1}
            />
          </div>

          {/* Saturation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Saturation</Label>
              <span className="text-sm text-muted-foreground">{saturation}%</span>
            </div>
            <Slider
              value={[saturation]}
              onValueChange={([value]) => setSaturation(value)}
              min={0}
              max={200}
              step={1}
            />
          </div>

          {/* Blur */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Blur</Label>
              <span className="text-sm text-muted-foreground">{blur}px</span>
            </div>
            <Slider
              value={[blur]}
              onValueChange={([value]) => setBlur(value)}
              min={0}
              max={40}
              step={0.5}
            />
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

          {/* Before/After Toggle */}
          <div className="flex items-center justify-between">
            <Label>Preview</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBeforeAfter(!showBeforeAfter)}
            >
              {showBeforeAfter ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Before/After
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Before/After
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
