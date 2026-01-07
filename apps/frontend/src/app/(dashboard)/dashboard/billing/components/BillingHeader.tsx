/**
 * Header de la page Billing
 */

'use client';

import { CreditCard } from 'lucide-react';

export function BillingHeader() {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
        <CreditCard className="w-8 h-8 text-cyan-400" />
        Facturation
      </h1>
      <p className="text-gray-400 mt-1">
        Gérez votre abonnement, vos méthodes de paiement et vos factures
      </p>
    </div>
  );
}


