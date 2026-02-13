'use client';

import { useI18n } from '@/i18n/useI18n';

export function ExportLabel() {
  const { t } = useI18n();
  return <>{t('common.export')}</>;
}
