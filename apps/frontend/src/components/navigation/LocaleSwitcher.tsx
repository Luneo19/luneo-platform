'use client';

import React, { useCallback, useTransition, memo } from 'react';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n, useTranslations } from '@/i18n/useI18n';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface LocaleSwitcherProps {
  className?: string;
}

function LocaleSwitcherContent({ className }: LocaleSwitcherProps) {
  const { locale, availableLocales } = useI18n();
  const t = useTranslations('localeSwitcher');
  const [isPending, startTransition] = useTransition();

  const handleChange = useCallback(
    (value: string) => {
      if (value === locale) return;
      startTransition(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('lang', value);
        window.location.href = url.toString();
      });
    },
    [locale],
  );

  return (
    <div className={cn('min-w-[9.5rem]', className)} data-testid="locale-switcher">
      <Select value={locale} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger
          aria-label={t('label')}
          className="gap-2"
          data-testid="locale-switcher-trigger"
        >
          <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <SelectValue placeholder={t('label')} />
        </SelectTrigger>
        <SelectContent>
          {availableLocales.map(({ locale: code, label, region, flag }) => (
            <SelectItem key={code} value={code}>
              <span className="flex flex-col">
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-base leading-none">
                    {flag}
                  </span>
                  <span>{label}</span>
                </span>
                <span className="pl-6 text-xs text-muted-foreground">{region}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const LocaleSwitcherContentMemo = memo(LocaleSwitcherContent);

export function LocaleSwitcher(props: LocaleSwitcherProps) {
  return (
    <ErrorBoundary componentName="LocaleSwitcher">
      <LocaleSwitcherContentMemo {...props} />
    </ErrorBoundary>
  );
}

