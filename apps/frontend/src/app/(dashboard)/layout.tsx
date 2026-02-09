'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { TerminologyProvider } from '@/providers/TerminologyProvider';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';

export default function DashboardLayoutGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    /**
     * Auth check via NestJS backend (JWT httpOnly cookies).
     * httpOnly cookies cannot be read by JavaScript — we validate by calling /auth/me.
     * Cookies are sent automatically via withCredentials: true on the API client.
     */
    const checkAuth = async () => {
      try {
        // Validate the session with the backend (httpOnly cookies sent automatically)
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

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <TerminologyProvider>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50" 
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            <div className="fixed inset-y-0 left-0 w-80">
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <Header
            title="Dashboard"
            subtitle="Tableau de bord principal"
            onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            isMobileMenuOpen={isMobileMenuOpen}
          />
          
          {/* Page Content */}
          <main id="main-content" className="flex-1 overflow-y-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TerminologyProvider>
  );
}