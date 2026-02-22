/**
 * Modal d'export
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ExportFormat } from '../../types';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
}

export function ExportModal({ open, onClose, onExport }: ExportModalProps) {
  const formats: { value: ExportFormat; label: string; description: string }[] = [
    { value: 'png', label: 'PNG', description: 'Image haute qualité' },
    { value: 'svg', label: 'SVG', description: 'Vectoriel scalable' },
    { value: 'pdf', label: 'PDF', description: 'Document imprimable' },
    { value: 'jpg', label: 'JPG', description: 'Image compressée' },
  ];

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('png');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Exporter le design</DialogTitle>
          <DialogDescription className="text-gray-600">
            Choisissez le format d'export
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as ExportFormat)}>
            <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formats.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  <div>
                    <div className="text-gray-900">{format.label}</div>
                    <div className="text-xs text-gray-600">{format.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-gray-600">
            Annuler
          </Button>
          <Button onClick={() => onExport(selectedFormat)} className="bg-blue-600 hover:bg-blue-700">
            Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



