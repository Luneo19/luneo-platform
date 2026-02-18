'use client';

import { useState } from 'react';
import { Save, Image as ImageIcon } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { usePresets } from '@/hooks/customizer/usePresets';
import { useToast } from '@/hooks/use-toast';

interface PresetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customizerId: string;
  canvasData?: Record<string, unknown>;
  thumbnailDataUrl?: string;
}

const PRESET_CATEGORIES = [
  'Business',
  'Social Media',
  'Marketing',
  'Personal',
  'Education',
  'Other',
];

/**
 * PresetsDialog - Create/edit preset dialog
 */
export function PresetsDialog({
  open,
  onOpenChange,
  customizerId,
  canvasData = {},
  thumbnailDataUrl,
}: PresetsDialogProps) {
  const { toast } = useToast();
  const { createPreset } = usePresets({ customizerId });
  
  const [presetName, setPresetName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  const handleSave = async () => {
    if (!presetName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a preset name',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createPreset(presetName, {
        ...canvasData,
        thumbnail: thumbnailDataUrl,
        category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        isPublic,
        isDefault,
      });
      
      toast({
        title: 'Preset saved',
        description: 'Your preset has been saved successfully',
      });
      
      handleClose();
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save preset',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setPresetName('');
    setDescription('');
    setCategory('Other');
    setTags('');
    setIsPublic(false);
    setIsDefault(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save Preset</DialogTitle>
          <DialogDescription>
            Create a preset from your current design
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preset Name */}
          <div className="space-y-2">
            <Label htmlFor="preset-name">Preset Name *</Label>
            <Input
              id="preset-name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="My Preset"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="preset-description">Description</Label>
            <Textarea
              id="preset-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this preset..."
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESET_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="preset-tags">Tags</Label>
            <Input
              id="preset-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas
            </p>
          </div>

          {/* Thumbnail Preview */}
          {thumbnailDataUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="relative aspect-video rounded border overflow-hidden bg-muted">
                <img
                  src={thumbnailDataUrl}
                  alt="Preset preview"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Public Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public</Label>
              <p className="text-sm text-muted-foreground">
                Make this preset visible to others
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {/* Set as Default Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Set as Default</Label>
              <p className="text-sm text-muted-foreground">
                Use this preset as the default template
              </p>
            </div>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!presetName.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Save Preset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
