'use client';

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
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { statusConfig, priorityConfig, categoryConfig } from './constants';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterStatus: string;
  filterPriority: string;
  filterCategory: string;
  onExport: () => void;
}

export function ExportDialog({
  open,
  onOpenChange,
  filterStatus,
  filterPriority,
  filterCategory,
  onExport,
}: ExportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 text-gray-900">
        <DialogHeader>
          <DialogTitle>Exporter les tickets</DialogTitle>
          <DialogDescription className="text-gray-600">
            Choisissez le format d&apos;export
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-gray-600 mb-2 block">Format</Label>
            <Select defaultValue="csv">
              <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 text-gray-900">
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm text-gray-600 mb-2 block">Filtres appliqués</Label>
            <div className="flex flex-wrap gap-2">
              {filterStatus !== 'all' && (
                <Badge variant="outline" className="border-gray-200">
                  Statut: {statusConfig[filterStatus]?.label}
                </Badge>
              )}
              {filterPriority !== 'all' && (
                <Badge variant="outline" className="border-gray-200">
                  Priorité: {priorityConfig[filterPriority]?.label}
                </Badge>
              )}
              {filterCategory !== 'all' && (
                <Badge variant="outline" className="border-gray-200">
                  Catégorie: {categoryConfig[filterCategory]?.label}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200">
            Annuler
          </Button>
          <Button onClick={onExport} className="bg-cyan-600 hover:bg-cyan-700">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
