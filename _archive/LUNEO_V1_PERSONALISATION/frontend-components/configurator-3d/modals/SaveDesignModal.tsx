'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Check, Copy } from 'lucide-react';
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
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface SaveDesignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveDesignModal({ open, onOpenChange }: SaveDesignModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedDesignId, setSavedDesignId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const saveDesign = useConfigurator3DStore((s) => s.saveDesign);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveDesign(name || undefined, description || undefined);
      if (result?.id) {
        setSavedDesignId(result.id);
        setShareUrl(
          typeof window !== 'undefined'
            ? `${window.location.origin}/configurator/design/${result.id}`
            : null
        );
        toast({
          title: 'Design saved',
          description: 'Your configuration has been saved successfully.',
        });
      } else {
        toast({
          title: 'Failed to save',
          description: 'Could not save your design. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Link copied to clipboard' });
    } catch {
      toast({
        title: 'Copy failed',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setIsPublic(false);
    setSavedDesignId(null);
    setShareUrl(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Design
          </DialogTitle>
          <DialogDescription>
            Save your configuration to access it later or share it with others.
          </DialogDescription>
        </DialogHeader>

        {!savedDesignId ? (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="My custom design"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add a description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="public">Make public</Label>
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </span>
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 py-4"
          >
            <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-success">
              <Check className="h-5 w-5" />
              <span className="font-medium">Design saved successfully!</span>
            </div>
            {shareUrl && (
              <div className="space-y-2">
                <Label>Share URL</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={shareUrl}
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
