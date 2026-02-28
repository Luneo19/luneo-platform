'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { TerminologyProvider } from '@/providers/TerminologyProvider';
import { DensityProvider, useDensity } from '@/providers/DensityProvider';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/useI18n';
import { CommandPalette } from '@/components/CommandPalette';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { PageTransition } from '@/components/PageTransition';
import { SkipToContent } from '@/components/ui/skip-to-content';
import { ensureSession } from '@/lib/auth/session-client';

const ONBOARDING_DISMISS_KEY = 'onboarding_dismissed_until';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useDensity();
  const { t } = useI18n();
  useKeyboardShortcuts();

  return (
    <div className="min-h-screen dash-bg flex overflow-x-hidden">
      <SkipToContent />

      {/* Subtle gradient mesh background */}
      <div className="fixed inset-0 dash-gradient-mesh pointer-events-none" aria-hidden="true" />

      {/* Sidebar - Desktop */}
      <nav className="hidden lg:block relative z-30" aria-label={t('dashboard.sidebar.navigation') || 'Navigation principale'}>
        <Sidebar />
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            id="mobile-sidebar-menu"
            className="fixed inset-y-0 left-0 w-[280px] max-w-[85vw] z-50"
            role="navigation"
            aria-label={t('dashboard.sidebar.mobileMenu') || 'Menu principal'}
          >
            <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Header */}
        <Header
          title={t('dashboard.title')}
          subtitle={t('dashboard.sidebar.dashboardDescription')}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />

        {/* Page Content */}
        <main
          id="main-content"
          role="main"
          aria-label={t('dashboard.mainContent') || 'Contenu principal'}
          className="flex-1 overflow-y-auto overflow-x-hidden dash-scroll min-w-0"
        >
          <div
            className="transition-all duration-200 px-4 sm:px-6"
            style={{ paddingTop: 'var(--dash-padding)', paddingBottom: 'var(--dash-padding)' }}
          >
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}

export default function DashboardLayoutGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const attemptedRecoveryRef = useRef(false);

  useEffect(() => {
    if (!isLoading && !user) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/overview';
      // httpOnly auth cookies are not readable from document.cookie, so we always
      // try one recovery cycle before redirecting to login.
      if (!attemptedRecoveryRef.current) {
        attemptedRecoveryRef.current = true;
        (async () => {
          try {
            const recovered = await ensureSession();
            if (recovered) {
              router.refresh();
              return;
            }
          } catch {
            // Fall through to login redirect below.
          }
          router.replace('/login?redirect=' + encodeURIComponent(currentPath));
        })();
        return;
      }

      router.replace('/login?redirect=' + encodeURIComponent(currentPath));
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user || onboardingChecked) return;

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isOnboardingPage = currentPath.startsWith('/onboarding');
    const isAdmin = user.role === 'ADMIN' || user.role === 'PLATFORM_ADMIN' || user.role === 'SUPER_ADMIN';

    if (isOnboardingPage || isAdmin) {
      setOnboardingChecked(true);
      return;
    }

    (async () => {
      try {
        const progressRes = await fetch('/api/onboarding/progress');
        if (progressRes.ok) {
          const progress = await progressRes.json();
          const completed =
            progress.progress?.completedAt ||
            progress.completedAt ||
            progress.organization?.onboardingCompletedAt;
          if (!completed && (progress.currentStep ?? 0) < 6) {
            const dismissedUntilRaw =
              typeof window !== 'undefined'
                ? window.localStorage.getItem(ONBOARDING_DISMISS_KEY)
                : null;
            const dismissedUntil = dismissedUntilRaw ? Number(dismissedUntilRaw) : 0;
            const isDismissedActive = Number.isFinite(dismissedUntil) && dismissedUntil > Date.now();

            if (isDismissedActive) {
              document.cookie = 'onboarding_completed=dismissed; path=/; max-age=86400; SameSite=Lax';
              setOnboardingChecked(true);
              return;
            }

            document.cookie = 'onboarding_completed=false; path=/; max-age=31536000; SameSite=Lax';
            router.push('/onboarding?reminder=1');
            return;
          } else {
            document.cookie = 'onboarding_completed=true; path=/; max-age=31536000; SameSite=Lax';
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(ONBOARDING_DISMISS_KEY);
            }
          }
        }
      } catch {
        // Onboarding check failed — allow access to dashboard
      }
      setOnboardingChecked(true);
    })();
  }, [user, onboardingChecked, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center dash-bg" role="status" aria-label={t('dashboard.common.loading') || 'Chargement'}>
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-black/[0.06] dark:border-white/[0.06]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-pink-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <p className="text-muted-foreground text-sm font-medium">{t('dashboard.common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <DensityProvider>
      <TerminologyProvider>
        <DashboardContent>{children}</DashboardContent>
      </TerminologyProvider>
    </DensityProvider>
  );
}
