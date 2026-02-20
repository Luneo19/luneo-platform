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
import { Switch } from '@/components/ui/switch';
import { useDesign } from '@/hooks/customizer/useDesign';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface SaveDesignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId?: string;
  thumbnailDataUrl?: string;
}

/**
 * SaveDesignDialog - Save design dialog
 */
export function SaveDesignDialog({ open, onOpenChange, sessionId, thumbnailDataUrl }: SaveDesignDialogProps) {
  const { toast } = useToast();
  const { saveDesign } = useDesign();
  
  const [designName, setDesignName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [allowRemix, setAllowRemix] = useState(false);

  const handleSave = async () => {
    if (!designName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a design name',
        variant: 'destructive',
      });
      return;
    }

    if (!sessionId) {
      toast({
        title: 'Session required',
        description: 'Session ID is required to save design',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Get canvas data from store or context
      const canvasData: Record<string, unknown> = {}; // This would come from canvas state
      
      await saveDesign(designName, canvasData, thumbnailDataUrl, sessionId);
      
      toast({
        title: 'Design saved',
        description: 'Your design has been saved successfully',
      });
      
      handleClose();
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save design',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setDesignName('');
    setDescription('');
    setIsPublic(false);
    setAllowRemix(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save Design</DialogTitle>
          <DialogDescription>
            Save your design for later use
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Design Name */}
          <div className="space-y-2">
            <Label htmlFor="design-name">Design Name *</Label>
            <Input
              id="design-name"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="My Awesome Design"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your design..."
              rows={3}
            />
          </div>

          {/* Thumbnail Preview */}
          {thumbnailDataUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="relative aspect-video rounded border overflow-hidden bg-muted">
                <Image width={200} height={200}
                  src={thumbnailDataUrl}
                  alt="Design preview"
                  className="w-full h-full object-contain"
                unoptimized />
              </div>
            </div>
          )}

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public</Label>
              <p className="text-sm text-muted-foreground">
                Make this design visible to others
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Allow Remix Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Remix</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to remix this design
              </p>
            </div>
            <Switch
              checked={allowRemix}
              onCheckedChange={setAllowRemix}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!designName.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
