'use client';

import { useI18n } from '@/i18n/useI18n';

export function NotAuthenticatedMessage() {
  const { t } = useI18n();
  return <p className="text-red-400">{t('analytics.notAuthenticated')}</p>;
}
