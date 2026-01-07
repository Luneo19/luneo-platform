/**
 * Carte du plan actuel
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, AlertCircle } from 'lucide-react';
import { useBilling } from '../hooks/useBilling';
import { formatDate } from '@/lib/utils/formatters';
import { CancelSubscriptionModal } from './modals/CancelSubscriptionModal';
import { useState } from 'react';

export function CurrentPlanCard() {
  const { subscription, isLoading } = useBilling();
  const [showCancelModal, setShowCancelModal] = useState(false);

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Plan actuel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return null;
  }

  const planName = subscription.tier === 'free' ? 'Gratuit' :
                   subscription.tier === 'starter' ? 'Starter' :
                   subscription.tier === 'pro' ? 'Professional' :
                   'Enterprise';

  const isActive = subscription.status === 'active';
  const isCancelled = subscription.stripe?.cancelAtPeriodEnd || subscription.status === 'cancelled';

  return (
    <>
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-400" />
                Plan actuel
              </CardTitle>
              <CardDescription className="text-gray-400 mt-1">
                {planName} • {subscription.period === 'yearly' ? 'Annuel' : 'Mensuel'}
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={
                isActive && !isCancelled
                  ? 'border-green-500/50 text-green-400'
                  : 'border-red-500/50 text-red-400'
              }
            >
              {isActive && !isCancelled ? 'Actif' : 'Annulé'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription.stripe?.currentPeriodEnd && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>
                Renouvellement le {formatDate(new Date(subscription.stripe.currentPeriodEnd))}
              </span>
            </div>
          )}
          {isCancelled && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">
                Votre abonnement sera annulé à la fin de la période actuelle
              </span>
            </div>
          )}
          {isActive && !isCancelled && (
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(true)}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              Annuler l'abonnement
            </Button>
          )}
        </CardContent>
      </Card>

      <CancelSubscriptionModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
      />
    </>
  );
}


