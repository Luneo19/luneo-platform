'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import type { CustomizerZone } from '@/stores/customizer';

interface ZoneConfigPanelProps {
  zone: CustomizerZone;
  onUpdate: (updates: Partial<CustomizerZone>) => void;
}

export function ZoneConfigPanel({ zone, onUpdate }: ZoneConfigPanelProps) {
  const [localZone, setLocalZone] = useState(zone);

  const handleFieldChange = (field: keyof CustomizerZone, value: unknown) => {
    const updated = { ...localZone, [field]: value };
    setLocalZone(updated);
  };

  const handleNestedChange = (path: string[], value: unknown) => {
    const updated = { ...localZone };
    let current: any = updated;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]] = { ...current[path[i]] };
    }
    current[path[path.length - 1]] = value;
    setLocalZone(updated);
  };

  const handleSave = () => {
    onUpdate(localZone);
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="zone-name">Name</Label>
          <Input
            id="zone-name"
            value={localZone.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zone-type">Type</Label>
          <Select
            value={localZone.type}
            onValueChange={(v) => handleFieldChange('type', v as CustomizerZone['type'])}
          >
            <SelectTrigger id="zone-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="shape">Shape</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Position & Size */}
      <div className="space-y-4">
        <h3 className="font-medium">Position & Size</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zone-x">X Position</Label>
            <Input
              id="zone-x"
              type="number"
              value={localZone.x}
              onChange={(e) => handleFieldChange('x', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zone-y">Y Position</Label>
            <Input
              id="zone-y"
              type="number"
              value={localZone.y}
              onChange={(e) => handleFieldChange('y', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zone-width">Width</Label>
            <Input
              id="zone-width"
              type="number"
              value={localZone.width}
              onChange={(e) => handleFieldChange('width', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zone-height">Height</Label>
            <Input
              id="zone-height"
              type="number"
              value={localZone.height}
              onChange={(e) => handleFieldChange('height', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Constraints */}
      <div className="space-y-4">
        <h3 className="font-medium">Constraints</h3>
        {localZone.constraints && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-width">Min Width</Label>
                <Input
                  id="min-width"
                  type="number"
                  value={localZone.constraints.minWidth || ''}
                  onChange={(e) =>
                    handleNestedChange(
                      ['constraints', 'minWidth'],
                      parseFloat(e.target.value) || undefined
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-height">Min Height</Label>
                <Input
                  id="min-height"
                  type="number"
                  value={localZone.constraints.minHeight || ''}
                  onChange={(e) =>
                    handleNestedChange(
                      ['constraints', 'minHeight'],
                      parseFloat(e.target.value) || undefined
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-width">Max Width</Label>
                <Input
                  id="max-width"
                  type="number"
                  value={localZone.constraints.maxWidth || ''}
                  onChange={(e) =>
                    handleNestedChange(
                      ['constraints', 'maxWidth'],
                      parseFloat(e.target.value) || undefined
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-height">Max Height</Label>
                <Input
                  id="max-height"
                  type="number"
                  value={localZone.constraints.maxHeight || ''}
                  onChange={(e) =>
                    handleNestedChange(
                      ['constraints', 'maxHeight'],
                      parseFloat(e.target.value) || undefined
                    )
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
              <Input
                id="aspect-ratio"
                type="number"
                step="0.1"
                value={localZone.constraints.aspectRatio || ''}
                onChange={(e) =>
                  handleNestedChange(
                    ['constraints', 'aspectRatio'],
                    parseFloat(e.target.value) || undefined
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for no aspect ratio constraint
              </p>
            </div>
          </>
        )}
        {!localZone.constraints && (
          <Button
            variant="outline"
            onClick={() => handleFieldChange('constraints', {})}
          >
            Add Constraints
          </Button>
        )}
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
