'use client';

import React, { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EXPORT_FORMATS } from '../data';

export interface CustomizerExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport?: (format: string) => void;
}

export function CustomizerExportDialog({
  open,
  onOpenChange,
  onExport,
}: CustomizerExportDialogProps) {
  const [format, setFormat] = useState('png');

  const handleExport = () => {
    onExport?.(format);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Exporter le design</DialogTitle>
          <DialogDescription className="text-gray-400">
            Choisissez le format d&apos;export pour télécharger votre design
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger id="format" className="bg-gray-900 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {EXPORT_FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label} — {f.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-600">
            Annuler
          </Button>
          <Button onClick={handleExport} className="bg-cyan-600 hover:bg-cyan-700">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
