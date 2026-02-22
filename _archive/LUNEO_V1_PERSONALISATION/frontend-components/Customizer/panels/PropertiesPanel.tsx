'use client';

import { Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSelectionStore, useLayersStore } from '@/stores/customizer';
import { ColorPickerTool } from '../tools/ColorPickerTool';
import { Separator } from '@/components/ui/separator';

/**
 * PropertiesPanel - Properties editor for selected object
 */
export function PropertiesPanel() {
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const { updateLayer, getLayerById } = useLayersStore();
  const selectedObject = selectedIds.length > 0 ? getLayerById(selectedIds[0]) : undefined;

  if (!selectedObject) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Properties</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select an object to edit its properties</p>
        </CardContent>
      </Card>
    );
  }

  const handleUpdate = (updates: Partial<typeof selectedObject>) => {
    updateLayer(selectedObject.id, updates);
  };

  const metadata = (selectedObject.metadata || {}) as Record<string, unknown>;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          <CardTitle>Properties</CardTitle>
        </div>
        <CardDescription>{selectedObject.name || selectedObject.type}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>X</Label>
            <Input
              type="number"
              value={Math.round((metadata.x as number) || 0)}
              onChange={(e) => {
                const newMetadata = { ...metadata, x: parseFloat(e.target.value) || 0 };
                handleUpdate({ metadata: newMetadata });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Y</Label>
            <Input
              type="number"
              value={Math.round((metadata.y as number) || 0)}
              onChange={(e) => {
                const newMetadata = { ...metadata, y: parseFloat(e.target.value) || 0 };
                handleUpdate({ metadata: newMetadata });
              }}
            />
          </div>
        </div>

        {/* Size */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>Width</Label>
            <Input
              type="number"
              value={Math.round((metadata.width as number) || 0)}
              onChange={(e) => {
                const newMetadata = { ...metadata, width: parseFloat(e.target.value) || 0 };
                handleUpdate({ metadata: newMetadata });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Height</Label>
            <Input
              type="number"
              value={Math.round((metadata.height as number) || 0)}
              onChange={(e) => {
                const newMetadata = { ...metadata, height: parseFloat(e.target.value) || 0 };
                handleUpdate({ metadata: newMetadata });
              }}
            />
          </div>
        </div>

        <Separator />

        {/* Rotation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Rotation</Label>
            <span className="text-sm text-muted-foreground">{Math.round((metadata.rotation as number) || 0)}°</span>
          </div>
          <Slider
            value={[(metadata.rotation as number) || 0]}
            onValueChange={([value]) => {
              const newMetadata = { ...metadata, rotation: value };
              handleUpdate({ metadata: newMetadata });
            }}
            min={0}
            max={360}
            step={1}
          />
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Opacity</Label>
            <span className="text-sm text-muted-foreground">{Math.round((selectedObject.opacity || 1) * 100)}%</span>
          </div>
          <Slider
            value={[(selectedObject.opacity || 1) * 100]}
            onValueChange={([value]) => handleUpdate({ opacity: value / 100 })}
            min={0}
            max={100}
            step={1}
          />
        </div>

        {/* Type-specific properties */}
        {selectedObject.type === 'text' && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select
                value={(metadata.fontFamily as string) || 'Arial'}
                onValueChange={(value) => {
                  const newMetadata = { ...metadata, fontFamily: value };
                  handleUpdate({ metadata: newMetadata });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Font Size</Label>
              <Input
                type="number"
                value={(metadata.fontSize as number) || 24}
                onChange={(e) => {
                  const newMetadata = { ...metadata, fontSize: parseFloat(e.target.value) || 24 };
                  handleUpdate({ metadata: newMetadata });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <ColorPickerTool
                value={(metadata.fill as string) || '#000000'}
                onChange={(color) => {
                  const newMetadata = { ...metadata, fill: color };
                  handleUpdate({ metadata: newMetadata });
                }}
              />
            </div>
          </>
        )}

        {selectedObject.type === 'shape' && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label>Fill Color</Label>
              <ColorPickerTool
                value={(metadata.fill as string) || '#3B82F6'}
                onChange={(color) => {
                  const newMetadata = { ...metadata, fill: color };
                  handleUpdate({ metadata: newMetadata });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Stroke Color</Label>
              <ColorPickerTool
                value={(metadata.stroke as string) || '#000000'}
                onChange={(color) => {
                  const newMetadata = { ...metadata, stroke: color };
                  handleUpdate({ metadata: newMetadata });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Stroke Width</Label>
              <Input
                type="number"
                value={(metadata.strokeWidth as number) || 0}
                onChange={(e) => {
                  const newMetadata = { ...metadata, strokeWidth: parseFloat(e.target.value) || 0 };
                  handleUpdate({ metadata: newMetadata });
                }}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
