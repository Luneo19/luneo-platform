/**
 * Modal QR Code pour partage AR
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
import { Input } from '@/components/ui/input';
import { QrCode, Copy, Share2 } from 'lucide-react';
import { useState } from 'react';

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
  qrCodeUrl?: string;
  shareUrl?: string;
  modelName?: string;
}

export function QRCodeModal({ open, onClose, qrCodeUrl, shareUrl, modelName }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (shareUrl && navigator.share) {
      try {
        await navigator.share({
          title: `AR Preview: ${modelName}`,
          text: `Découvrez ce modèle en AR: ${modelName}`,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Partager en AR</DialogTitle>
          <DialogDescription className="text-gray-400">
            Scannez le QR code ou partagez le lien pour voir le modèle en AR
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {qrCodeUrl && (
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
            </div>
          )}
          {shareUrl && (
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Lien de partage</label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="bg-gray-900 border-gray-600 text-white"
                />
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="border-gray-600"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                {navigator.share && (
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="border-gray-600"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {copied && (
                <p className="text-sm text-green-400">Lien copié !</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-gray-600">
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


