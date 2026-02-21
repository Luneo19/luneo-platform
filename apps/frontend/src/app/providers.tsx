'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { I18nProvider } from '@/i18n/provider';
import type { TranslationMessages, SupportedLocale } from '@/i18n/server';
import { FeatureFlagProvider } from '@/contexts/FeatureFlagContext';
import { BrandThemeProvider } from '@/components/theme/BrandThemeProvider';
import { registerServiceWorker } from '@/lib/pwa/register-service-worker';
import { trpc, getTRPCClient } from '@/lib/trpc/client';

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
            gcTime: 1000 * 60 * 30, // 30 minutes
            refetchOnWindowFocus: false,
            refetchOnReconnect: 'always',
            retry: 2,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  const [trpcClient] = useState(() => getTRPCClient());

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    }
  }, []);

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <I18nProvider 
              locale={locale} 
              messages={messages}
              currency={currency}
              timezone={timezone}
              availableLocales={availableLocales.map(loc => ({
                locale: loc.locale,
                label: loc.label,
                region: loc.region,
                flag: loc.flag,
              }))}
            >
              <AuthProvider>
                <FeatureFlagProvider
                  flags={featureFlags}
                  updatedAt={featureFlagsUpdatedAt}
                >
                  <BrandThemeProvider>
                    {children}
                  </BrandThemeProvider>
                </FeatureFlagProvider>
              </AuthProvider>
            </I18nProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}
