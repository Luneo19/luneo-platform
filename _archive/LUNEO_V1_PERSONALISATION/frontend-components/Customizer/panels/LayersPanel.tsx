'use client';

import { Layers, Eye, EyeOff, Lock, Unlock, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLayersStore, useSelectionStore } from '@/stores/customizer';
import { cn } from '@/lib/utils';

/**
 * LayersPanel - Layers management panel
 */
export function LayersPanel() {
  const { layers, toggleVisibility, toggleLock, removeLayer, setActiveLayer } = useLayersStore();
  const { selectedIds, select, deselectAll } = useSelectionStore();

  const sortedLayers = [...layers].sort((a, b) => b.sortOrder - a.sortOrder);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          <CardTitle>Layers</CardTitle>
        </div>
        <CardDescription>Manage layer visibility and order</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-1 p-4">
            {sortedLayers.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No layers yet
              </div>
            ) : (
              sortedLayers.map((layer) => {
                const isSelected = selectedIds.includes(layer.id);
                return (
                  <div
                    key={layer.id}
                    className={cn(
                      'group flex items-center gap-2 rounded border p-2 transition-colors',
                      isSelected && 'border-primary bg-primary/5'
                    )}
                    onClick={() => {
                      if (isSelected) {
                        deselectAll();
                      } else {
                        select(layer.id);
                      }
                    }}
                  >
                    <GripVertical className="h-4 w-4 cursor-move text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="flex-1 truncate text-sm font-medium">{layer.name || layer.type}</div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisibility(layer.id);
                        }}
                      >
                        {layer.isVisible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLock(layer.id);
                        }}
                      >
                        {layer.isLocked ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Unlock className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLayer(layer.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
