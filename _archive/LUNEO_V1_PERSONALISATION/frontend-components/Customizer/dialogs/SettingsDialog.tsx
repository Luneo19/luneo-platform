'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ColorPickerTool } from '../tools/ColorPickerTool';
import { Separator } from '@/components/ui/separator';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (settings: EditorSettings) => void;
}

interface EditorSettings {
  canvasWidth: number;
  canvasHeight: number;
  canvasUnit: 'px' | 'mm' | 'in' | 'cm';
  dpi: number;
  backgroundColor: string;
  gridSize: number;
  gridSnap: boolean;
  uiTheme: 'light' | 'dark' | 'auto';
  autoSave: boolean;
  qualityPreset: 'draft' | 'standard' | 'high';
}

/**
 * SettingsDialog - Editor settings dialog
 */
export function SettingsDialog({ open, onOpenChange, onApply }: SettingsDialogProps) {
  const [settings, setSettings] = useState<EditorSettings>({
    canvasWidth: 800,
    canvasHeight: 600,
    canvasUnit: 'px',
    dpi: 300,
    backgroundColor: '#FFFFFF',
    gridSize: 20,
    gridSnap: true,
    uiTheme: 'auto',
    autoSave: true,
    qualityPreset: 'standard',
  });

  const handleApply = () => {
    if (onApply) {
      onApply(settings);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editor Settings</DialogTitle>
          <DialogDescription>
            Configure canvas and editor preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Canvas Dimensions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Canvas Dimensions</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label>Width</Label>
                <Input
                  type="number"
                  value={settings.canvasWidth}
                  onChange={(e) =>
                    setSettings({ ...settings, canvasWidth: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Height</Label>
                <Input
                  type="number"
                  value={settings.canvasHeight}
                  onChange={(e) =>
                    setSettings({ ...settings, canvasHeight: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={settings.canvasUnit}
                  onValueChange={(value) =>
                    setSettings({ ...settings, canvasUnit: value as EditorSettings['canvasUnit'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="px">Pixels (px)</SelectItem>
                    <SelectItem value="mm">Millimeters (mm)</SelectItem>
                    <SelectItem value="in">Inches (in)</SelectItem>
                    <SelectItem value="cm">Centimeters (cm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* DPI Setting */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>DPI</Label>
              <span className="text-sm text-muted-foreground">{settings.dpi} DPI</span>
            </div>
            <Slider
              value={[settings.dpi]}
              onValueChange={([value]) => setSettings({ ...settings, dpi: value })}
              min={72}
              max={600}
              step={1}
            />
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <Label>Background Color</Label>
            <ColorPickerTool
              value={settings.backgroundColor}
              onChange={(color) => setSettings({ ...settings, backgroundColor: color })}
            />
          </div>

          <Separator />

          {/* Grid Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Grid Settings</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Grid Size</Label>
                <span className="text-sm text-muted-foreground">{settings.gridSize}px</span>
              </div>
              <Slider
                value={[settings.gridSize]}
                onValueChange={([value]) => setSettings({ ...settings, gridSize: value })}
                min={5}
                max={100}
                step={5}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Snap to Grid</Label>
              <Switch
                checked={settings.gridSnap}
                onCheckedChange={(checked) => setSettings({ ...settings, gridSnap: checked })}
              />
            </div>
          </div>

          <Separator />

          {/* UI Theme */}
          <div className="space-y-2">
            <Label>UI Theme</Label>
            <Select
              value={settings.uiTheme}
              onValueChange={(value) =>
                setSettings({ ...settings, uiTheme: value as EditorSettings['uiTheme'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">Auto (System)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Auto-save */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-save</Label>
              <p className="text-sm text-muted-foreground">
                Automatically save changes periodically
              </p>
            </div>
            <Switch
              checked={settings.autoSave}
              onCheckedChange={(checked) => setSettings({ ...settings, autoSave: checked })}
            />
          </div>

          {/* Quality Preset */}
          <div className="space-y-2">
            <Label>Quality Preset</Label>
            <Select
              value={settings.qualityPreset}
              onValueChange={(value) =>
                setSettings({ ...settings, qualityPreset: value as EditorSettings['qualityPreset'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft (Fast)</SelectItem>
                <SelectItem value="standard">Standard (Balanced)</SelectItem>
                <SelectItem value="high">High (Best Quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
