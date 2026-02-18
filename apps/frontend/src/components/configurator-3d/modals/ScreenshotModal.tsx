'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Download, Share2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface ScreenshotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  onCapture: () => Promise<string | null>;
}

const RESOLUTIONS = [
  { value: '1024', label: '1024×1024' },
  { value: '2048', label: '2048×2048' },
  { value: '4096', label: '4096×4096' },
];

const FORMATS = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
];

export function ScreenshotModal({
  open,
  onOpenChange,
  imageUrl,
  onCapture,
}: ScreenshotModalProps) {
  const [resolution, setResolution] = useState('2048');
  const [format, setFormat] = useState('png');
  const [transparentBg, setTransparentBg] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(imageUrl);
  const { toast } = useToast();

  React.useEffect(() => {
    setCurrentImage(imageUrl);
  }, [imageUrl]);

  const handleCapture = async () => {
    setIsCapturing(true);
    try {
      const url = await onCapture();
      if (url) {
        setCurrentImage(url);
        toast({ title: 'Screenshot captured' });
      } else {
        toast({
          title: 'Capture failed',
          variant: 'destructive',
        });
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownload = () => {
    if (!currentImage) return;
    const a = document.createElement('a');
    a.href = currentImage;
    a.download = `configurator-screenshot-${Date.now()}.${format}`;
    a.click();
    toast({ title: 'Download started' });
  };

  const handleShare = async () => {
    if (!currentImage) return;
    try {
      const blob = await fetch(currentImage).then((r) => r.blob());
      const file = new File([blob], 'screenshot.png', { type: blob.type });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My 3D Configuration',
        });
        toast({ title: 'Shared successfully' });
      } else {
        await navigator.clipboard.writeText(currentImage);
        toast({ title: 'Image URL copied to clipboard' });
      }
    } catch {
      toast({
        title: 'Share failed',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Screenshot
          </DialogTitle>
          <DialogDescription>
            Capture, customize, and download or share your 3D configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
            {currentImage ? (
              <img
                src={currentImage}
                alt="Screenshot"
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <p className="text-sm">No screenshot yet</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Resolution</Label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="transparent">Transparent background</Label>
            <Switch
              id="transparent"
              checked={transparentBg}
              onCheckedChange={setTransparentBg}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCapture}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Capturing...
              </span>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Capture
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleShare}
            disabled={!currentImage}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button onClick={handleDownload} disabled={!currentImage}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
