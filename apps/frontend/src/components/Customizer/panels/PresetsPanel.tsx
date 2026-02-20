'use client';

import { useState } from 'react';
import { Star, Plus, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePresets } from '@/hooks/customizer/usePresets';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface PresetsPanelProps {
  customizerId: string;
}

/**
 * PresetsPanel - Template presets panel
 */
export function PresetsPanel({ customizerId }: PresetsPanelProps) {
  const { toast } = useToast();
  const { presets, isLoading, applyPreset, createPreset } = usePresets({ customizerId });

  const handleApplyPreset = async (id: string) => {
    try {
      await applyPreset(id);
      toast({
        title: 'Preset applied',
        description: 'Preset has been applied to the canvas',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to apply preset',
        variant: 'destructive',
      });
    }
  };

  const handleCreatePreset = () => {
    toast({
      title: 'Create Preset',
      description: 'Preset creation dialog will open',
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            <CardTitle>Presets</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={handleCreatePreset}>
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        </div>
        <CardDescription>Template presets and designs</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-200px)]">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-video rounded border bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : presets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Star className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                No presets available
              </p>
              <Button onClick={handleCreatePreset} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create from current design
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset.id)}
                  className="group relative rounded-lg border overflow-hidden hover:border-primary transition-colors text-left"
                >
                  {preset.thumbnail ? (
                    <div className="aspect-video relative">
                      <Image width={200} height={200}
                        src={preset.thumbnail}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                      unoptimized />
                      <div className="absolute top-2 right-2">
                        {preset.id.startsWith('featured') && (
                          <Badge variant="secondary" className="bg-yellow-500">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video flex items-center justify-center bg-muted">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="font-medium text-sm truncate">{preset.name}</div>
                    {preset.createdAt && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(preset.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
