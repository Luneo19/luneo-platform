/**
 * Modal de désactivation de la 2FA
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
import { AlertTriangle, RefreshCw, ShieldOff } from 'lucide-react';

interface Disable2FAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDisable: () => Promise<{ success: boolean }>;
  isDisabling?: boolean;
}

export function Disable2FAModal({
  open,
  onOpenChange,
  onDisable,
  isDisabling = false,
}: Disable2FAModalProps) {
  const handleDisable = async () => {
    const result = await onDisable();
    if (result.success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-red-400">Désactiver la 2FA</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir désactiver l'authentification à deux facteurs ?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                La désactivation de la 2FA réduira la sécurité de votre compte. Votre compte sera
                uniquement protégé par votre mot de passe.
              </span>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200">
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisable}
            disabled={isDisabling}
          >
            {isDisabling ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Désactivation...
              </>
            ) : (
              <>
                <ShieldOff className="w-4 h-4 mr-2" />
                Désactiver la 2FA
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



