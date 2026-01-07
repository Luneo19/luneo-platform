/**
 * Modal de changement de plan
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
import { useState } from 'react';
import type { SubscriptionTier } from '../../types';

interface ChangePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: SubscriptionTier;
}

export function ChangePlanModal({ open, onOpenChange, planId }: ChangePlanModalProps) {
  const { createCheckoutSession, isLoading } = useBilling();
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plan = PLANS.find((p) => p.id === planId);

  const handleChangePlan = async () => {
    const result = await createCheckoutSession(planId, period);
    if (result.success) {
      onOpenChange(false);
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Changer de plan</DialogTitle>
          <DialogDescription>
            Vous allez passer au plan {plan.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Période</label>
            <Select value={period} onValueChange={(value) => setPeriod(value as 'monthly' | 'yearly')}>
              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">
                  Mensuel - {plan.price.monthly}€/mois
                </SelectItem>
                <SelectItem value="yearly">
                  Annuel - {plan.price.yearly}€/an (-20%)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <p className="text-sm text-cyan-400">
              Vous serez redirigé vers Stripe pour finaliser le paiement
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-600">
            Annuler
          </Button>
          <Button
            onClick={handleChangePlan}
            disabled={isLoading}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Redirection...
              </>
            ) : (
              'Continuer vers le paiement'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


