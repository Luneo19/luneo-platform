'use client';

import Image from 'next/image';
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
import type { GeneratedModel } from './types';

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: GeneratedModel | null;
  onExportClick: () => void;
}

export function PreviewDialog({ open, onOpenChange, model, onExportClick }: PreviewDialogProps) {
  if (!model) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aperçu du modèle 3D</DialogTitle>
          <DialogDescription className="text-slate-400">
            {model.name || model.prompt}
          </DialogDescription>
        </DialogHeader>
        <div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden mt-6">
          <Image
            src={model.thumbnail}
            alt={model.prompt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 80vw"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700">
            Fermer
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onExportClick();
            }}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
