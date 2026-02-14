'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { TerminologyProvider } from '@/providers/TerminologyProvider';
import { DensityProvider, useDensity } from '@/providers/DensityProvider';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';
import { sidebarConfig } from '@/styles/dashboard-tokens';
import { useI18n } from '@/i18n/useI18n';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { sidebarCollapsed } = useDensity();
  const { t } = useI18n();

  return (
    <div className="min-h-screen dash-bg flex overflow-x-hidden">
      {/* Subtle gradient mesh background */}
      <div className="fixed inset-0 dash-gradient-mesh pointer-events-none" />

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block relative z-30">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div id="mobile-sidebar-menu" className="fixed inset-y-0 left-0 w-[280px] max-w-[85vw] z-50" role="navigation" aria-label="Menu principal">
            <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
          </div>
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
        <main id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden dash-scroll min-w-0">
          <div
            className="transition-all duration-200 px-4 sm:px-6"
            style={{ paddingTop: 'var(--dash-padding)', paddingBottom: 'var(--dash-padding)' }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayoutGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await endpoints.auth.me();
        setIsAuthenticated(true);

        // Check onboarding status for non-admin users
        // Skip if user is already on the onboarding page
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        const isOnboardingPage = currentPath.startsWith('/onboarding');
        const userWithRole = user as { role?: string } | null;
        const isAdmin = userWithRole?.role === 'PLATFORM_ADMIN' || userWithRole?.role === 'SUPER_ADMIN';

        if (!isOnboardingPage && !isAdmin) {
          try {
            const progressRes = await fetch('/api/onboarding/progress');
            if (progressRes.ok) {
              const progress = await progressRes.json();
              const completed = progress.organization?.onboardingCompletedAt;
              if (!completed && progress.currentStep < 6) {
                document.cookie = 'onboarding_completed=false; path=/; max-age=31536000; SameSite=Lax';
                router.push('/onboarding');
                return;
              } else {
                // Onboarding is done — set cookie for middleware
                document.cookie = 'onboarding_completed=true; path=/; max-age=31536000; SameSite=Lax';
              }
            }
          } catch {
            // Onboarding check failed silently - don't block the user
          }
        }
      } catch (error) {
        logger.error('Auth check error', {
          error,
          pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        setIsAuthenticated(false);
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/overview';
        router.push('/login?redirect=' + encodeURIComponent(currentPath));
      }
    };
    checkAuth();
  }, [router]);

  // Dark loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center dash-bg">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-pink-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <p className="text-white/40 text-sm font-medium">{t('dashboard.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DensityProvider>
      <TerminologyProvider>
        <DashboardContent>{children}</DashboardContent>
      </TerminologyProvider>
    </DensityProvider>
  );
}
