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

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { sidebarCollapsed } = useDensity();

  return (
    <div className="min-h-screen dash-bg flex">
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
          <div className="fixed inset-y-0 left-0 w-[280px] z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Header */}
        <Header
          title="Dashboard"
          subtitle="Tableau de bord principal"
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />

        {/* Page Content */}
        <main id="main-content" className="flex-1 overflow-y-auto dash-scroll">
          <div
            className="transition-all duration-200"
            style={{ padding: 'var(--dash-padding)' }}
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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await endpoints.auth.me();
        setIsAuthenticated(true);
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
          <p className="text-white/40 text-sm font-medium">Chargement...</p>
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
