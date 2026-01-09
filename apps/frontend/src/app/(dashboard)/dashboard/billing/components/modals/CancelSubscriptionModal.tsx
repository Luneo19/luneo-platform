/**
 * Modal d'annulation d'abonnement
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
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useBilling } from '../../hooks/useBilling';

interface CancelSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelSubscriptionModal({
  open,
  onOpenChange,
}: CancelSubscriptionModalProps) {
  const { cancelSubscription, isLoading } = useBilling();

  const handleCancel = async () => {
    const result = await cancelSubscription(true);
    if (result.success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-red-400">Annuler l'abonnement</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir annuler votre abonnement ?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Votre abonnement restera actif jusqu'à la fin de la période actuelle. Vous ne
                serez plus facturé après cette date.
              </span>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-600">
            Garder l'abonnement
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Annulation...
              </>
            ) : (
              'Annuler l\'abonnement'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



