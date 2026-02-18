'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
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
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface PrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewUrl?: string;
  showBleed?: boolean;
  showCropMarks?: boolean;
  showSafeZone?: boolean;
}

/**
 * PrintPreviewDialog - Print preview dialog
 */
export function PrintPreviewDialog({
  open,
  onOpenChange,
  previewUrl,
  showBleed = true,
  showCropMarks = true,
  showSafeZone = true,
}: PrintPreviewDialogProps) {
  const [scale, setScale] = useState(100);

  const handleDownload = () => {
    if (previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = 'print-preview.pdf';
      link.click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Print Preview</DialogTitle>
          <DialogDescription>
            Preview your design before printing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scale Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Scale</Label>
              <span className="text-sm text-muted-foreground">{scale}%</span>
            </div>
            <Slider
              value={[scale]}
              onValueChange={([value]) => setScale(value)}
              min={25}
              max={200}
              step={5}
            />
          </div>

          {/* Preview Area */}
          <div className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 bg-muted/20 overflow-auto max-h-[60vh]">
            <div
              className="relative mx-auto bg-white shadow-lg"
              style={{
                transform: `scale(${scale / 100})`,
                transformOrigin: 'top center',
              }}
            >
              {/* Bleed Area */}
              {showBleed && (
                <div className="absolute inset-0 border-2 border-red-500 pointer-events-none" />
              )}

              {/* Safe Zone */}
              {showSafeZone && (
                <div className="absolute inset-4 border border-blue-300 border-dashed pointer-events-none" />
              )}

              {/* Crop Marks */}
              {showCropMarks && (
                <>
                  {/* Top-left */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-black" />
                  {/* Top-right */}
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-black" />
                  {/* Bottom-left */}
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-black" />
                  {/* Bottom-right */}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-black" />
                </>
              )}

              {/* Preview Content */}
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Print preview"
                  className="w-full h-auto"
                />
              ) : (
                <div className="w-full h-[600px] flex items-center justify-center bg-white text-muted-foreground">
                  Preview not available
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs text-muted-foreground">
            {showBleed && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-red-500" />
                <span>Bleed Area</span>
              </div>
            )}
            {showSafeZone && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-blue-300 border-dashed" />
                <span>Safe Zone</span>
              </div>
            )}
            {showCropMarks && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black" />
                <span>Crop Marks</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleDownload} disabled={!previewUrl}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
