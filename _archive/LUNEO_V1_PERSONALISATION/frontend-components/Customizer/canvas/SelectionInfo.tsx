'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import type { LayerItem } from '@/stores/customizer';
import { useLayersStore } from '@/stores/customizer';

interface SelectionInfoProps {
  object: LayerItem;
}

/**
 * SelectionInfo - Shows position, size, rotation, scale of selected object
 * Editable fields for precise control
 */
export function SelectionInfo({ object }: SelectionInfoProps) {
  const { updateLayer } = useLayersStore();

  const handleChange = (field: string, value: number) => {
    const metadata = { ...(object.metadata || {}), [field]: value };
    updateLayer(object.id, { metadata });
  };

  const metadata = (object.metadata || {}) as Record<string, unknown>;

  return (
    <Card className="absolute bottom-4 left-4 z-50 w-64 p-4 shadow-lg">
      <div className="space-y-3">
        <div className="text-sm font-semibold">Selection Info</div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="x" className="text-xs">
              X
            </Label>
            <Input
              id="x"
              type="number"
              value={Math.round((metadata.x as number) || 0)}
              onChange={(e) => handleChange('x', parseFloat(e.target.value) || 0)}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="y" className="text-xs">
              Y
            </Label>
            <Input
              id="y"
              type="number"
              value={Math.round((metadata.y as number) || 0)}
              onChange={(e) => handleChange('y', parseFloat(e.target.value) || 0)}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="width" className="text-xs">
              Width
            </Label>
            <Input
              id="width"
              type="number"
              value={Math.round((metadata.width as number) || 0)}
              onChange={(e) => handleChange('width', parseFloat(e.target.value) || 0)}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="height" className="text-xs">
              Height
            </Label>
            <Input
              id="height"
              type="number"
              value={Math.round((metadata.height as number) || 0)}
              onChange={(e) => handleChange('height', parseFloat(e.target.value) || 0)}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="rotation" className="text-xs">
              Rotation
            </Label>
            <Input
              id="rotation"
              type="number"
              value={Math.round((metadata.rotation as number) || 0)}
              onChange={(e) => handleChange('rotation', parseFloat(e.target.value) || 0)}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="scale" className="text-xs">
              Scale
            </Label>
            <Input
              id="scale"
              type="number"
              value={Math.round(((metadata.scaleX as number) || 1) * 100)}
              onChange={(e) => {
                const scale = parseFloat(e.target.value) / 100 || 1;
                handleChange('scaleX', scale);
                handleChange('scaleY', scale);
              }}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
