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
import { useI18n } from '@/i18n/useI18n';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';
import type { Configuration3D } from '../../types';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configuration: Configuration3D | null;
}

export function ExportModal({ open, onOpenChange, configuration }: ExportModalProps) {
  const { toast } = useToast();
  const { t } = useI18n();
  const [format, setFormat] = useState('png');

  const handleExport = async () => {
    if (!configuration) {
      toast({
        title: t('configurator3d.error'),
        description: t('configurator3d.noConfigToExport'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await api.post<Blob | { url?: string; blob?: unknown }>(
        '/api/v1/configurator-3d/export',
        { format, configurationId: configuration.id }
      );
      const data = response as unknown;
      if (data && typeof data === 'object' && (data as Blob).size !== undefined && (data as Blob).type !== undefined) {
        const blob = data as Blob;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `configuration-${configuration.id}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (data && typeof data === 'object' && typeof (data as { url?: string }).url === 'string') {
        window.open((data as { url: string }).url, '_blank');
        toast({
          title: t('configurator3d.export'),
          description: t('configurator3d.exportSuccess'),
        });
      } else {
        toast({
          title: t('configurator3d.export'),
          description: t('configurator3d.exportRequested'),
        });
      }
      onOpenChange(false);
    } catch (error: unknown) {
      logger.error(
        'Error exporting 3D configuration',
        error instanceof Error ? error : new Error(String(error))
      );
      toast({
        title: t('configurator3d.error'),
        description: getErrorDisplayMessage(error),
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 text-gray-900">
        <DialogHeader>
          <DialogTitle>{t('configurator3d.exportConfig')}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('configurator3d.exportFormat')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm text-gray-700 mb-2 block">{t('configurator3d.exportFormatDesc')}</label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">{t('configurator3d.formatPng')}</SelectItem>
                <SelectItem value="jpg">{t('configurator3d.formatJpg')}</SelectItem>
                <SelectItem value="glb">{t('configurator3d.formatGlb')}</SelectItem>
                <SelectItem value="gltf">{t('configurator3d.formatGltf')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200">
            {t('configurator3d.cancel')}
          </Button>
          <Button onClick={handleExport} className="bg-cyan-600 hover:bg-cyan-700">
            <Download className="w-4 h-4 mr-2" />
            {t('configurator3d.export')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



