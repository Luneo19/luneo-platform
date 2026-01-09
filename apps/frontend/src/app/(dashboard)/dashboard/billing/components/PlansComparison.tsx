/**
 * Comparaison des plans disponibles
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { PLANS } from '../constants/plans';
import { useBilling } from '../hooks/useBilling';
import { useState } from 'react';
import { ChangePlanModal } from './modals/ChangePlanModal';
import type { SubscriptionTier } from '../types';

export function PlansComparison() {
  const { subscription, isLoading } = useBilling();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier | null>(null);
  const [showModal, setShowModal] = useState(false);

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Plans disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  const handleSelectPlan = (planId: SubscriptionTier) => {
    if (subscription?.tier === planId) return;
    setSelectedPlan(planId);
    setShowModal(true);
  };

  return (
    <>
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Plans disponibles</CardTitle>
          <CardDescription className="text-gray-400">
            Choisissez le plan qui correspond à vos besoins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const isCurrentPlan = subscription?.tier === plan.id;
              return (
                <Card
                  key={plan.id}
                  className={`bg-gray-900/50 border-gray-700 ${
                    plan.popular ? 'border-cyan-500/50' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{plan.name}</CardTitle>
                      {plan.popular && (
                        <Badge className="bg-cyan-500/20 text-cyan-400">Populaire</Badge>
                      )}
                    </div>
                    <CardDescription className="text-gray-400">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-white">
                        {plan.price.monthly}€
                      </span>
                      <span className="text-gray-400">/mois</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      ou {plan.price.yearly}€/an (-20%)
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCurrentPlan}
                      className={`w-full ${
                        isCurrentPlan
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : plan.popular
                          ? 'bg-cyan-600 hover:bg-cyan-700'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {isCurrentPlan ? 'Plan actuel' : 'Choisir ce plan'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedPlan && (
        <ChangePlanModal
          open={showModal}
          onOpenChange={setShowModal}
          planId={selectedPlan}
        />
      )}
    </>
  );
}



