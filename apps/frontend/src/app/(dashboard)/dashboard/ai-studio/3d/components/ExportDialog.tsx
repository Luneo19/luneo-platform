'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { Download, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EXPORT_FORMATS } from './constants';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';

export type ExportToastFn = (opts: { title: string; description: string }) => void;

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExportConfirm: ExportToastFn;
  modelId?: string;
  modelUrl?: string;
}

export function ExportDialog({ open, onOpenChange, onExportConfirm, modelId, modelUrl }: ExportDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<string>('GLB');
  const [includeTextures, setIncludeTextures] = useState(true);
  const [includeMaterials, setIncludeMaterials] = useState(true);
  const [optimizeGeometry, setOptimizeGeometry] = useState(false);
  const [compressDraco, setCompressDraco] = useState(false);
  const [resolution, setResolution] = useState('high');
  const [isExporting, setIsExporting] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('aiStudio.export3dTitle')}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('aiStudio.export3dDesc')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-6">
          <div className="space-y-3">
            <Label className="text-gray-900">Format d&apos;export</Label>
            <div className="grid grid-cols-2 gap-3">
              {EXPORT_FORMATS.map((format, idx) => (
                <Card
                  key={idx}
                  onClick={() => format.compatible && setSelectedFormat(format.format)}
                  className={`bg-gray-50 border-gray-200 transition-all ${
                    !format.compatible
                      ? 'opacity-50 cursor-not-allowed'
                      : selectedFormat === format.format
                      ? 'border-cyan-500 bg-cyan-50 cursor-pointer'
                      : 'cursor-pointer hover:border-cyan-500/50'
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">{format.format}</span>
                      {!format.compatible && (
                        <span className="rounded bg-orange-100 text-orange-600 px-2 py-0.5 text-xs">Conversion requise</span>
                      )}
                      {format.compatible && selectedFormat === format.format && (
                        <span className="rounded bg-cyan-500 px-2 py-0.5 text-xs text-white">Sélectionné</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{format.description}</p>
                    <p className="text-xs text-gray-500">Taille estimée: {format.size}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator className="bg-gray-200" />

          <div className="space-y-3">
            <Label className="text-gray-900">Options d&apos;export</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={includeTextures}
                  onCheckedChange={(v) => setIncludeTextures(v === true)}
                  className="border-gray-200"
                />
                <Label className="text-sm text-gray-700">Inclure les textures</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={includeMaterials}
                  onCheckedChange={(v) => setIncludeMaterials(v === true)}
                  className="border-gray-200"
                />
                <Label className="text-sm text-gray-700">Inclure les matériaux</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={optimizeGeometry}
                  onCheckedChange={(v) => setOptimizeGeometry(v === true)}
                  className="border-gray-200"
                />
                <Label className="text-sm text-gray-700">Optimiser la géométrie</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={compressDraco}
                  onCheckedChange={(v) => setCompressDraco(v === true)}
                  className="border-gray-200"
                />
                <Label className="text-sm text-gray-700">Compresser avec Draco</Label>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-200" />

          <div className="space-y-3">
            <Label className="text-gray-900">Résolution</Label>
            <Select value={resolution} onValueChange={setResolution}>
              <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Basse (512×512)</SelectItem>
                <SelectItem value="medium">Moyenne (1024×1024)</SelectItem>
                <SelectItem value="high">Haute (2048×2048)</SelectItem>
                <SelectItem value="ultra">Ultra (4096×4096)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-200"
              disabled={isExporting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={async () => {
                if (!modelId && !modelUrl) {
                  toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'No model selected for export',
                  });
                  return;
                }

                setIsExporting(true);
                try {
                  // Call the 3D export API endpoint
                  const formatMap: Record<string, string> = {
                    GLB: 'glb',
                    OBJ: 'obj',
                    STL: 'stl',
                    USDZ: 'usdz',
                    FBX: 'fbx',
                    PLY: 'ply',
                  };

                  const exportFormat = formatMap[selectedFormat] || 'glb';
                  const response = await api.post('/api/v1/render/3d/export-ar', {
                    configurationId: modelId,
                    modelUrl: modelUrl,
                    platform: selectedFormat === 'USDZ' ? 'ios' : 'web',
                    format: exportFormat,
                    includeTextures,
                    includeMaterials,
                    optimizeGeometry,
                    compressDraco,
                    resolution,
                  });

                  const exportData = response as { exportUrl?: string; data?: { exportUrl?: string } };
                  const downloadUrl = exportData.exportUrl || exportData.data?.exportUrl;

                  if (downloadUrl) {
                    // Trigger download
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = `model-${Date.now()}.${exportFormat}`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    onExportConfirm({
                      title: t('common.export'),
                      description: t('aiStudio.exportComplete') || 'Export completed successfully',
                    });
                  } else {
                    throw new Error('No export URL returned');
                  }

                  onOpenChange(false);
                } catch (error) {
                  logger.error('Failed to export 3D model', error instanceof Error ? error : new Error(String(error)));
                  toast({
                    variant: 'destructive',
                    title: 'Export Failed',
                    description: getErrorDisplayMessage(error),
                  });
                } finally {
                  setIsExporting(false);
                }
              }}
              className="bg-cyan-600 hover:bg-cyan-700"
              disabled={isExporting || !selectedFormat}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('aiStudio.exportInProgress') || 'Exporting...'}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  {t('common.export')}
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
