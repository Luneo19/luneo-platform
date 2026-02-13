/**
 * Modal pour générer et afficher QR Code AR
 */

'use client';

import { useI18n } from '@/i18n/useI18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { ARModel } from '../../types';

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: ARModel | null;
}

export function QRCodeModal({ open, onOpenChange, model }: QRCodeModalProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!model || !open) return;

    const arLink = `${window.location.origin}/ar/viewer?model=${model.glbUrl || model.usdzUrl}`;
    // Générer QR Code via API publique
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(arLink)}`;
    setQrCodeUrl(qrUrl);
  }, [model, open]);

  const handleDownload = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-ar-${model?.name || 'model'}.png`;
    link.click();
    toast({ title: t('arStudio.qrDownloaded') });
  };

  const handleCopyLink = () => {
    if (!model) return;
    const arLink = `${window.location.origin}/ar/viewer?model=${model.glbUrl || model.usdzUrl}`;
    navigator.clipboard.writeText(arLink);
    toast({ title: t('aiStudio.linkCopied'), description: t('arStudio.arLinkCopied') });
  };

  if (!model) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 text-gray-900">
        <DialogHeader>
          <DialogTitle>{t('arStudio.qrTitle')} - {model.name}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('arStudio.qrDesc')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {qrCodeUrl && (
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg">
                {/* next/image not needed for data URLs */}
                <img src={qrCodeUrl} alt="QR Code AR" className="w-64 h-64" />
              </div>
            </div>
          )}
          <p className="text-sm text-gray-600 text-center">
            {t('arStudio.scanQR')}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCopyLink} className="flex-1 border-gray-200">
              <Copy className="w-4 h-4 mr-2" />
              {t('arStudio.copyLink')}
            </Button>
            <Button onClick={handleDownload} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
              <Download className="w-4 h-4 mr-2" />
              {t('arStudio.downloadQR')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



