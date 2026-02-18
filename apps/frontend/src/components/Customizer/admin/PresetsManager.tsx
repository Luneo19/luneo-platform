'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MoreVertical, Plus, Edit2, Trash2, Eye, EyeOff, Star, StarOff } from 'lucide-react';
import type { CustomizerPreset } from '@/stores/customizer';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';

interface PresetsManagerProps {
  customizerId: string;
  presets: CustomizerPreset[];
  onPresetUpdate?: () => void;
}

export function PresetsManager({ customizerId, presets, onPresetUpdate }: PresetsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);

  const filteredPresets = presets.filter((preset) => {
    const matchesSearch = preset.name.toLowerCase().includes(searchQuery.toLowerCase());
    // Category filtering would be based on preset.category if it exists
    const matchesCategory = categoryFilter === 'all' || true; // Placeholder
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (presetId: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) return;

    try {
      await api.delete(`/api/v1/customizer/configurations/${customizerId}/presets/${presetId}`);
      onPresetUpdate?.();
    } catch (err) {
      logger.error('Failed to delete preset', { error: err });
    }
  };

  const handleTogglePublic = async (presetId: string, isPublic: boolean) => {
    try {
      await api.patch(`/api/v1/customizer/configurations/${customizerId}/presets/${presetId}`, {
        isPublic: !isPublic,
      });
      onPresetUpdate?.();
    } catch (err) {
      logger.error('Failed to update preset', { error: err });
    }
  };

  const handleToggleFeatured = async (presetId: string, isFeatured: boolean) => {
    try {
      await api.patch(`/api/v1/customizer/configurations/${customizerId}/presets/${presetId}`, {
        isFeatured: !isFeatured,
      });
      onPresetUpdate?.();
    } catch (err) {
      logger.error('Failed to update preset', { error: err });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Presets</h2>
          <p className="text-muted-foreground">Manage design presets for this customizer</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Preset
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search presets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="recent">Recent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPresets.map((preset) => (
          <Card key={preset.id} className="relative group">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{preset.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleTogglePublic(preset.id, false)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Make Public
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleFeatured(preset.id, false)}>
                      <Star className="mr-2 h-4 w-4" />
                      Feature
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(preset.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center overflow-hidden">
                {preset.thumbnail ? (
                  <img
                    src={preset.thumbnail}
                    alt={preset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground text-sm">No thumbnail</div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Usage: 0</Badge>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">
                    Public
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Featured
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredPresets.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No presets found. Create your first preset to get started.
          </div>
        )}
      </div>

      {/* Create Preset Dialog */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Preset</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                To create a preset, first design something in the customizer, then save it as a
                preset.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreating(false)}>Go to Customizer</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
