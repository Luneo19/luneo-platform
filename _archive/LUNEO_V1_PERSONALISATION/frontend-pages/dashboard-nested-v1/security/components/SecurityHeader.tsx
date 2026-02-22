/**
 * Header de la page Security
 */

'use client';

import { useI18n } from '@/i18n/useI18n';
import { Shield } from 'lucide-react';

export function SecurityHeader() {
  const { t } = useI18n();
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
        <Shield className="w-8 h-8 text-cyan-400" />
        {t('security.title')}
      </h1>
      <p className="text-white/60 mt-1">
        {t('security.subtitle')}
      </p>
    </div>
  );
}



