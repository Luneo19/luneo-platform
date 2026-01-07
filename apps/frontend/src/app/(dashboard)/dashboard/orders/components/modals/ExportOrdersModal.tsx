/**
 * Modal d'export de commandes
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
import { Download, FileSpreadsheet, FileJson } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Order } from '../../types';

interface ExportOrdersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportFormat: 'csv' | 'json';
  onFormatChange: (format: 'csv' | 'json') => void;
  onExport: () => void;
  orderCount: number;
}

export function ExportOrdersModal({
  open,
  onOpenChange,
  exportFormat,
  onFormatChange,
  onExport,
  orderCount,
}: ExportOrdersModalProps) {
  const formats = [
    { value: 'csv' as const, label: 'CSV', icon: FileSpreadsheet },
    { value: 'json' as const, label: 'JSON', icon: FileJson },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Exporter les commandes</DialogTitle>
          <DialogDescription>
            Choisissez le format d'export pour {orderCount} commande(s)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                      : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                  )}
                >
                  <Icon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-white font-medium">{format.label}</p>
                </button>
              );
            })}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-600"
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


