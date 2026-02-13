'use client';

import { useI18n } from '@/i18n/useI18n';
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

export type ExportToastFn = (opts: { title: string; description: string }) => void;

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExportConfirm: ExportToastFn;
}

export function ExportDialog({ open, onOpenChange, onExportConfirm }: ExportDialogProps) {
  const { t } = useI18n();
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
                  className={`bg-gray-50 border-gray-200 cursor-pointer hover:border-cyan-500/50 transition-all ${
                    !format.compatible ? 'opacity-50' : ''
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">{format.format}</span>
                      {!format.compatible && (
                        <span className="rounded bg-yellow-500 px-2 py-0.5 text-xs">Bientôt</span>
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
                <Checkbox defaultChecked className="border-gray-200" />
                <Label className="text-sm text-gray-700">Inclure les textures</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox defaultChecked className="border-gray-200" />
                <Label className="text-sm text-gray-700">Inclure les matériaux</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox className="border-gray-200" />
                <Label className="text-sm text-gray-700">Optimiser la géométrie</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox className="border-gray-200" />
                <Label className="text-sm text-gray-700">Compresser avec Draco</Label>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-200" />

          <div className="space-y-3">
            <Label className="text-gray-900">Résolution</Label>
            <Select defaultValue="high">
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
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                onExportConfirm({ title: t('common.export'), description: t('aiStudio.exportInProgress') });
                onOpenChange(false);
              }}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('common.export')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
