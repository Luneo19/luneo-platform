/**
 * Header de la page Billing
 */

'use client';

import { CreditCard } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';

export function BillingHeader() {
  const { t } = useI18n();
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
        <CreditCard className="w-8 h-8 text-cyan-400" />
        {t('dashboard.billing.title')}
      </h1>
      <p className="text-gray-400 mt-1">
        {t('dashboard.billing.subtitle')}
      </p>
    </div>
  );
}



