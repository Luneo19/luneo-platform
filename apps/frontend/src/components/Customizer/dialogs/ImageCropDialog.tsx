'use client';

import { useState, useRef } from 'react';
import { Crop, X } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onCrop?: (cropRect: { x: number; y: number; width: number; height: number }) => void;
}

type AspectRatio = 'free' | '1:1' | '4:3' | '16:9';

/**
 * ImageCropDialog - Image crop dialog
 */
export function ImageCropDialog({ open, onOpenChange, imageUrl, onCrop }: ImageCropDialogProps) {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const aspectRatios: Record<AspectRatio, number | null> = {
    'free': null,
    '1:1': 1,
    '4:3': 4 / 3,
    '16:9': 16 / 9,
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const width = Math.abs(x - dragStart.x);
    const height = aspectRatio === 'free' 
      ? Math.abs(y - dragStart.y)
      : width / (aspectRatios[aspectRatio] || 1);

    setCropRect({
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      width,
      height,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleApply = () => {
    if (onCrop && cropRect.width > 0 && cropRect.height > 0) {
      onCrop(cropRect);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
          <DialogDescription>
            Select the area to crop
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Aspect Ratio Selector */}
          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={(value) => setAspectRatio(value as AspectRatio)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="1:1">1:1 (Square)</SelectItem>
                <SelectItem value="4:3">4:3</SelectItem>
                <SelectItem value="16:9">16:9</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image Preview with Crop Overlay */}
          <div
            ref={containerRef}
            className="relative border rounded-lg overflow-hidden bg-muted"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <Image width={200} height={200}
              ref={imageRef}
              src={imageUrl}
              alt="Crop preview"
              className="w-full h-auto max-h-[400px] object-contain"
            unoptimized />
            {cropRect.width > 0 && cropRect.height > 0 && (
              <div
                className="absolute border-2 border-primary bg-primary/10"
                style={{
                  left: `${cropRect.x}px`,
                  top: `${cropRect.y}px`,
                  width: `${cropRect.width}px`,
                  height: `${cropRect.height}px`,
                }}
              >
                {/* Crop Handles */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary border-2 border-white rounded-full cursor-nwse-resize" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary border-2 border-white rounded-full cursor-nesw-resize" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary border-2 border-white rounded-full cursor-nesw-resize" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border-2 border-white rounded-full cursor-nwse-resize" />
              </div>
            )}
          </div>

          {/* Crop Info */}
          {cropRect.width > 0 && cropRect.height > 0 && (
            <div className="text-sm text-muted-foreground">
              Size: {Math.round(cropRect.width)} × {Math.round(cropRect.height)}px
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={cropRect.width === 0 || cropRect.height === 0}>
            <Crop className="h-4 w-4 mr-2" />
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
