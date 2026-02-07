'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { logger } from '@/lib/logger';

export default function DashboardLayoutGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        
        // Skip auth check if Supabase is not configured
        if (!supabase || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
          // Use backend API auth check instead
          // ✅ FIX: Vérifier d'abord si un token existe avant d'appeler le backend
          const hasToken = typeof window !== 'undefined' && (
            localStorage.getItem('accessToken') ||
            localStorage.getItem('token') ||
            document.cookie.includes('accessToken') ||
            document.cookie.includes('refreshToken')
          );
          
          if (!hasToken) {
            // Pas de token = pas connecté, redirect vers login
            setIsAuthenticated(false);
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/overview';
            router.push('/login?redirect=' + encodeURIComponent(currentPath));
            return;
          }
          
          try {
            const response = await fetch('/api/auth/me');
            if (!response.ok) {
              setIsAuthenticated(false);
              // Token invalide, nettoyer
              localStorage.removeItem('accessToken');
              localStorage.removeItem('token');
              const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/overview';
              router.push('/login?redirect=' + encodeURIComponent(currentPath));
              return;
            }
            setIsAuthenticated(true);
            return;
          } catch (err) {
            setIsAuthenticated(false);
            router.push('/login');
            return;
          }
        }
        
        // First try to get existing session
        let { data: { session }, error } = await supabase.auth.getSession();

        // If no session, try to get user (might be in cookies but not yet in session)
        if (!session && !error) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // User exists but session might not be loaded yet, wait a bit and retry
            await new Promise(resolve => setTimeout(resolve, 300));
            const retry = await supabase.auth.getSession();
            session = retry.data.session;
            error = retry.error;
          }
        }

        if (error || !session) {
          setIsAuthenticated(false);
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/overview';
          router.push('/login?redirect=' + encodeURIComponent(currentPath));
          return;
        }

        // Store session token for backend API calls
        if (session.access_token) {
          localStorage.setItem('accessToken', session.access_token);
        }

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
  );
}