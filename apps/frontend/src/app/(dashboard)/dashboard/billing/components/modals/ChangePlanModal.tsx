/**
 * Modal de changement de plan
 * - Pour les abonnés existants : utilise change-plan (proration)
 * - Pour les nouveaux : utilise create-checkout-session (Stripe Checkout)
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';
import { useBilling } from '../../hooks/useBilling';
import { PLANS } from '../../constants/plans';
import { useState, useEffect } from 'react';
import type { SubscriptionTier } from '../../types';
import { useI18n } from '@/i18n/useI18n';

interface ChangePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: SubscriptionTier;
}

export function ChangePlanModal({ open, onOpenChange, planId }: ChangePlanModalProps) {
  const { t } = useI18n();
  const { subscription, fetchSubscription, updateSubscription, createCheckoutSession, isLoading } = useBilling();
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plan = PLANS.find((p) => p.id === planId);

  // Fetch current subscription when modal opens
  useEffect(() => {
    if (open && !subscription) {
      fetchSubscription();
    }
  }, [open, subscription, fetchSubscription]);

  const hasActiveSubscription = subscription && subscription.status !== 'cancelled' && subscription.status !== 'inactive';

  const handleChangePlan = async () => {
    if (hasActiveSubscription) {
      // Existing subscriber: use change-plan API (proration, no redirect)
      const result = await updateSubscription(planId);
      if (result.success) {
        onOpenChange(false);
      }
    } else {
      // New subscriber: create Stripe Checkout session
      const result = await createCheckoutSession(planId, period);
      if (result.success) {
        onOpenChange(false);
      }
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 text-gray-900">
        <DialogHeader>
          <DialogTitle>{t('dashboard.billing.changePlanModalTitle')}</DialogTitle>
          <DialogDescription>
            {t('dashboard.billing.switchToPlan')} {plan.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm text-gray-700 mb-2 block">{t('dashboard.billing.period')}</label>
            <Select value={period} onValueChange={(value) => setPeriod(value as 'monthly' | 'yearly')}>
              <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">
                  {t('dashboard.billing.monthly')} - {plan.price.monthly}€{t('dashboard.billing.perMonth')}
                </SelectItem>
                <SelectItem value="yearly">
                  {t('dashboard.billing.yearly')} - {plan.price.yearly}€{t('dashboard.billing.perYear')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <p className="text-sm text-cyan-400">
              {hasActiveSubscription
                ? t('dashboard.billing.prorataNote')
                : t('dashboard.billing.redirectNote')}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200">
            {t('dashboard.common.cancel')}
          </Button>
          <Button
            onClick={handleChangePlan}
            disabled={isLoading}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {hasActiveSubscription ? t('dashboard.billing.updating') : t('dashboard.billing.redirecting')}
              </>
            ) : (
              hasActiveSubscription ? t('dashboard.billing.confirmChange') : t('dashboard.billing.continueToPayment')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
