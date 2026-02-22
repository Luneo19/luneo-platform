/**
 * Modal d'activation de la 2FA
 */

'use client';

import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { QrCode, RefreshCw, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface Enable2FAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnable: (token?: string) => Promise<{ success: boolean; data?: unknown }>;
  isEnabling?: boolean;
  qrCode?: string;
  backupCodes?: string[];
}

export function Enable2FAModal({
  open,
  onOpenChange,
  onEnable,
  isEnabling = false,
  qrCode,
  backupCodes,
}: Enable2FAModalProps) {
  const [token, setToken] = useState('');
  const [step, setStep] = useState<'qr' | 'verify'>('qr');

  useEffect(() => {
    if (open && !qrCode) {
      // Générer le QR code
      onEnable();
    }
  }, [open, qrCode, onEnable]);

  useEffect(() => {
    if (qrCode) {
      setStep('qr');
    }
  }, [qrCode]);

  const handleVerify = async () => {
    if (!token || token.length !== 6) return;

    const result = await onEnable(token);
    if (result.success) {
      setStep('verify');
      setToken('');
    }
  };

  const handleClose = () => {
    setToken('');
    setStep('qr');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="dash-card border-white/[0.06] bg-[#12121a] text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Activer l'authentification à deux facteurs</DialogTitle>
          <DialogDescription className="text-white/60">
            {step === 'qr'
              ? 'Scannez le QR code avec votre application d\'authentification'
              : '2FA activée avec succès !'}
          </DialogDescription>
        </DialogHeader>

        {step === 'qr' && qrCode ? (
          <div className="space-y-4 mt-4">
            <div className="flex justify-center p-4 bg-white/[0.04] rounded-lg">
              <Image
                src={qrCode}
                alt="QR Code 2FA"
                width={200}
                height={200}
                className="w-48 h-48"
              />
            </div>
            <div>
              <Label className="text-white/80">Code de vérification</Label>
              <Input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="bg-white/[0.04] border-white/[0.06] text-white mt-1 text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-white/40 mt-1">
                Entrez le code à 6 chiffres de votre application
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} className="border-white/[0.06] hover:bg-white/[0.04]">
                Annuler
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isEnabling || token.length !== 6}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
              >
                {isEnabling ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Vérifier
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : step === 'verify' ? (
          <div className="space-y-4 mt-4 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
            <p className="text-white/80">
              L'authentification à deux facteurs a été activée avec succès !
            </p>
            {backupCodes && (
              <div className="p-4 bg-yellow-950/20 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-400 mb-2">
                  ⚠️ Enregistrez vos codes de secours maintenant
                </p>
                <p className="text-xs text-white/60">
                  Ces codes ne seront affichés qu'une seule fois
                </p>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleClose} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 w-full">
                Fermer
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

