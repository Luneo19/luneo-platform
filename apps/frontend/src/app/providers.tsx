'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { I18nProvider } from '@/i18n/provider';
import type { TranslationMessages, SupportedLocale } from '@/i18n/server';
import { FeatureFlagProvider } from '@/contexts/FeatureFlagContext';

interface ProvidersProps {
  children: React.ReactNode;
  locale: SupportedLocale;
  messages: TranslationMessages;
  currency: string;
  timezone: string;
  availableLocales: Array<{
    locale: SupportedLocale;
    label: string;
    region: string;
    flag: string;
  }>;
  featureFlags: Record<string, boolean>;
  featureFlagsUpdatedAt: string | null;
}

export function Providers({
  children,
  locale,
  messages,
  currency,
  timezone,
  availableLocales,
  featureFlags,
  featureFlagsUpdatedAt,
}: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: false,
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <FeatureFlagProvider flags={featureFlags} updatedAt={featureFlagsUpdatedAt}>
          <I18nProvider
            locale={locale}
            messages={messages}
            currency={currency}
            timezone={timezone}
            availableLocales={availableLocales}
          >
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <AuthProvider>
                <ThemeWatcher />
                {children}
              </AuthProvider>
            </ThemeProvider>
          </I18nProvider>
        </FeatureFlagProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function ThemeWatcher() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  return null;
}