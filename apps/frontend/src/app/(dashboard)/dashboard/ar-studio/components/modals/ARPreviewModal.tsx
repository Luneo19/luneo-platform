/**
 * Modal de prévisualisation AR
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, QrCode, Copy, ExternalLink, Download, Smartphone } from 'lucide-react';
import Image from 'next/image';
import { formatDate, formatBytes, formatNumber } from '@/lib/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import type { ARModel } from '../../types';

interface ARPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: ARModel | null;
  onViewAR: (model: ARModel) => void;
  onGenerateQR: (model: ARModel) => void;
}

export function ARPreviewModal({
  open,
  onOpenChange,
  model,
  onViewAR,
  onGenerateQR,
}: ARPreviewModalProps) {
  const { toast } = useToast();

  if (!model) return null;

  const handleCopyEmbedCode = () => {
    const embedCode = `<iframe src="${window.location.origin}/ar/viewer?model=${model.glbUrl || model.usdzUrl}" width="100%" height="600px" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast({ title: 'Code copié', description: 'Code embed copié dans le presse-papiers' });
  };

  const handleCopyARLink = () => {
    const arLink = `${window.location.origin}/ar/viewer?model=${model.glbUrl || model.usdzUrl}`;
    navigator.clipboard.writeText(arLink);
    toast({ title: 'Lien copié', description: 'Lien AR copié dans le presse-papiers' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{model.name}</DialogTitle>
              <DialogDescription className="text-gray-600">
                Détails et options de partage AR
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {model.status === 'active' && (
                <Badge className="bg-green-500">Actif</Badge>
              )}
              {model.format === 'Both' && (
                <Badge className="bg-cyan-500">USDZ + GLB</Badge>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="bg-gray-100 border-gray-200">
              <TabsTrigger value="preview">Prévisualisation</TabsTrigger>
              <TabsTrigger value="stats">Statistiques</TabsTrigger>
              <TabsTrigger value="share">Partage</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="space-y-4">
              <div className="relative aspect-video w-full bg-gray-900 rounded-lg overflow-hidden">
                <Image
                  src={model.thumbnail}
                  alt={model.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Taille</p>
                  <p className="text-gray-900 font-medium">{formatBytes(model.fileSize)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Type</p>
                  <p className="text-gray-900 font-medium capitalize">{model.type}</p>
                </div>
                <div>
                  <p className="text-gray-600">Format</p>
                  <p className="text-gray-900 font-medium">{model.format}</p>
                </div>
                <div>
                  <p className="text-gray-600">Créé le</p>
                  <p className="text-gray-900 font-medium">{formatDate(model.createdAt)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => onViewAR(model)} className="bg-cyan-600 hover:bg-cyan-700">
                  <Play className="w-4 h-4 mr-2" />
                  Voir en AR
                </Button>
                <Button variant="outline" className="border-gray-600">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="stats" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Vues</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(model.views)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Try-Ons</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(model.tryOns)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Conversions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(model.conversions)}
                  </p>
                </div>
              </div>
              {model.tryOns > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Taux de conversion</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {((model.conversions / model.tryOns) * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="share" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Lien AR</p>
                  <div className="flex gap-2">
                    <Input
                      value={`${window.location.origin}/ar/viewer?model=${model.glbUrl || model.usdzUrl}`}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-900 text-sm"
                    />
                    <Button variant="outline" onClick={handleCopyARLink} className="border-gray-200">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Code Embed</p>
                  <div className="flex gap-2">
                    <Input
                      value={`<iframe src="${window.location.origin}/ar/viewer?model=${model.glbUrl || model.usdzUrl}"></iframe>`}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-900 text-sm"
                    />
                    <Button variant="outline" onClick={handleCopyEmbedCode} className="border-gray-200">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button onClick={() => onGenerateQR(model)} className="bg-cyan-600 hover:bg-cyan-700">
                  <QrCode className="w-4 h-4 mr-2" />
                  Générer QR Code
                </Button>
                <Button variant="outline" className="border-gray-200">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ouvrir dans nouvelle fenêtre
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}



