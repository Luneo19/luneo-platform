/**
 * Modal d'export de produits
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileJson, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductDisplay } from '../../types';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportFormat: 'csv' | 'json' | 'pdf';
  onFormatChange: (format: 'csv' | 'json' | 'pdf') => void;
  onExport: () => void;
  productCount: number;
}

export function ExportModal({
  open,
  onOpenChange,
  exportFormat,
  onFormatChange,
  onExport,
  productCount,
}: ExportModalProps) {
  const formats = [
    { value: 'csv' as const, label: 'CSV', icon: FileSpreadsheet },
    { value: 'json' as const, label: 'JSON', icon: FileJson },
    { value: 'pdf' as const, label: 'PDF', icon: FileText },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 text-gray-900">
        <DialogHeader>
          <DialogTitle>Exporter les produits</DialogTitle>
          <DialogDescription>
            Choisissez le format d'export pour {productCount} produit(s)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {formats.map((format) => {
              const Icon = format.icon;
              return (
                <button
                  key={format.value}
                  onClick={() => onFormatChange(format.value)}
                  className={cn(
                    'p-4 border-2 rounded-lg transition-all',
                    exportFormat === format.value
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  )}
                >
                  <Icon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  <p className="text-gray-900 font-medium">{format.label}</p>
                </button>
              );
            })}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-200"
          >
            Annuler
          </Button>
          <Button
            onClick={onExport}
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



