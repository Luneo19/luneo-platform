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
import { useI18n } from '@/i18n/useI18n';

interface CancelSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelSubscriptionModal({
  open,
  onOpenChange,
}: CancelSubscriptionModalProps) {
  const { t } = useI18n();
  const { cancelSubscription, isLoading } = useBilling();

  const handleCancel = async () => {
    const result = await cancelSubscription(true);
    if (result.success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-red-400">{t('dashboard.billing.cancelConfirmTitle')}</DialogTitle>
          <DialogDescription>
            {t('dashboard.billing.cancelConfirmDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                {t('dashboard.billing.cancelNote')}
              </span>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200">
            {t('dashboard.billing.keepSubscription')}
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {t('dashboard.billing.cancelling')}
              </>
            ) : (
              t('dashboard.billing.cancelSubscription')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



