/**
 * Client Component pour la page Billing
 * Version simplifiée avec fonctionnalités essentielles uniquement
 */

'use client';

import { useEffect, useRef } from 'react';
import { BillingHeader } from './components/BillingHeader';
import { CurrentPlanCard } from './components/CurrentPlanCard';
import { PlansComparison } from './components/PlansComparison';
import { PaymentMethodsSection } from './components/PaymentMethodsSection';
import { InvoicesSection } from './components/InvoicesSection';
import { useBilling } from './hooks/useBilling';

export function BillingPageClient() {
  const { fetchSubscription } = useBilling();
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    fetchSubscription();
  }, [fetchSubscription]);

  return (
    <div className="space-y-6 pb-10">
      <BillingHeader />
      <CurrentPlanCard />
      <PlansComparison />
      <PaymentMethodsSection />
      <InvoicesSection />
    </div>
  );
}



