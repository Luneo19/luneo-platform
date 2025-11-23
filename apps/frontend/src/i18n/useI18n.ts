'use client';

import { useMemo } from 'react';
import { useI18nContext } from './provider';

export function useI18n() {
  return useI18nContext();
}

export function useTranslations(namespace?: string) {
  const { t } = useI18nContext();

  return useMemo(
    () => (key: string, values?: Record<string, string | number | boolean>) =>
      t(namespace ? `${namespace}.${key}` : key, values),
    [namespace, t],
  );
}

