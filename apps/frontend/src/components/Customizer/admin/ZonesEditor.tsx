'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import type { CustomizerZone } from '@/stores/customizer';
import { ZoneConfigPanel } from './ZoneConfigPanel';

interface ZonesEditorProps {
  zones: CustomizerZone[];
  canvasWidth: number;
  canvasHeight: number;
  onZoneAdd: (zone: Omit<CustomizerZone, 'id'>) => void;
  onZoneUpdate: (id: string, zone: Partial<CustomizerZone>) => void;
  onZoneDelete: (id: string) => void;
}

export function ZonesEditor({
  zones,
  canvasWidth,
  canvasHeight,
  onZoneAdd,
  onZoneUpdate,
  onZoneDelete,
}: ZonesEditorProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [isAddingZone, setIsAddingZone] = useState(false);

  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  const handleAddZone = useCallback(() => {
    const newZone: Omit<CustomizerZone, 'id'> = {
      name: `Zone ${zones.length + 1}`,
      x: canvasWidth * 0.1,
      y: canvasHeight * 0.1,
      width: canvasWidth * 0.3,
      height: canvasHeight * 0.3,
      type: 'text',
    };
    onZoneAdd(newZone);
    setIsAddingZone(false);
  }, [zones.length, canvasWidth, canvasHeight, onZoneAdd]);

  const handleZoneSelect = useCallback(
    (zoneId: string) => {
      setSelectedZoneId(zoneId === selectedZoneId ? null : zoneId);
    },
    [selectedZoneId]
  );

  const handleZoneUpdate = useCallback(
    (updates: Partial<CustomizerZone>) => {
      if (selectedZoneId) {
        onZoneUpdate(selectedZoneId, updates);
      }
    },
    [selectedZoneId, onZoneUpdate]
  );

  // Calculate preview scale
  const previewScale = Math.min(400 / canvasWidth, 300 / canvasHeight, 1);

  return (
    <div className="flex h-full gap-4">
      {/* Canvas Preview */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Canvas Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="relative border-2 border-dashed border-muted bg-muted/20"
            style={{
              width: canvasWidth * previewScale,
              height: canvasHeight * previewScale,
              margin: '0 auto',
            }}
          >
            {zones.map((zone) => {
              const isSelected = zone.id === selectedZoneId;
              return (
                <div
                  key={zone.id}
                  onClick={() => handleZoneSelect(zone.id)}
                  className={`absolute cursor-pointer border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/20'
                      : 'border-muted-foreground/50 bg-muted-foreground/10 hover:border-muted-foreground'
                  }`}
                  style={{
                    left: zone.x * previewScale,
                    top: zone.y * previewScale,
                    width: zone.width * previewScale,
                    height: zone.height * previewScale,
                  }}
                >
                  <div className="absolute -top-6 left-0 text-xs font-medium">
                    {zone.name}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Zone List Sidebar */}
      <Card className="w-80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Zones</CardTitle>
            <Button size="sm" onClick={() => setIsAddingZone(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Zone
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  onClick={() => handleZoneSelect(zone.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedZoneId === zone.id
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{zone.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {zone.type}
                      </div>
                      <div className="flex gap-1 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {Math.round(zone.x)}, {Math.round(zone.y)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(zone.width)} × {Math.round(zone.height)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleZoneSelect(zone.id);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onZoneDelete(zone.id);
                          if (selectedZoneId === zone.id) {
                            setSelectedZoneId(null);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {zones.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No zones yet. Click &quot;Add Zone&quot; to create one.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Zone Config Panel */}
      {selectedZone && (
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Zone Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <ZoneConfigPanel zone={selectedZone} onUpdate={handleZoneUpdate} />
          </CardContent>
        </Card>
      )}

      {isAddingZone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Add New Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                A new zone will be added at the default position. You can configure it after
                creation.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddingZone(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddZone}>Add Zone</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
