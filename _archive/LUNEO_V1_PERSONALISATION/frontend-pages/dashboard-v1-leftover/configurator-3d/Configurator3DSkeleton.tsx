'use client';

import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';

export function Configurator3DSkeleton() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
        <p className="text-white/60">{t('configurator3d.loading')}</p>
      </div>
    </div>
  );
}
