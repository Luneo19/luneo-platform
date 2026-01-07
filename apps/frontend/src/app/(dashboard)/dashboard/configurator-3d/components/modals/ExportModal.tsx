/**
 * Modal d'export pour le Configurator 3D
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Configuration3D } from '../../types';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configuration: Configuration3D | null;
}

export function ExportModal({ open, onOpenChange, configuration }: ExportModalProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState('png');

  const handleExport = async () => {
    if (!configuration) return;

    try {
      // TODO: Implémenter l'export réel
      toast({
        title: 'Export',
        description: `Export en ${format} en cours...`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'export',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Exporter la configuration</DialogTitle>
          <DialogDescription className="text-gray-400">
            Choisissez le format d'export
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Format</label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (Image)</SelectItem>
                <SelectItem value="jpg">JPG (Image)</SelectItem>
                <SelectItem value="glb">GLB (3D)</SelectItem>
                <SelectItem value="gltf">GLTF (3D)</SelectItem>
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


