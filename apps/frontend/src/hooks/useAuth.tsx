'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

import type { AuthContextType, AuthUser } from './types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth calls use RELATIVE URLs so they go through the Vercel proxy (same-origin).
// This ensures httpOnly cookies set by the backend response are properly stored
// by the browser (no cross-origin cookie issues).
// The Vercel rewrite in vercel.json proxies /api/* → https://api.luneo.app/api/*
const AUTH_BASE = '';

/**
 * Map backend user response to AuthUser
 */
const mapBackendUser = (backendUser: Record<string, unknown>): AuthUser => ({
  id: String(backendUser.id ?? ''),
  email: String(backendUser.email ?? ''),
  firstName: String(backendUser.firstName ?? backendUser.first_name ?? ''),
  lastName: String(backendUser.lastName ?? backendUser.last_name ?? ''),
  role: backendUser.role ? String(backendUser.role) : undefined,
  brandId: backendUser.brandId ? String(backendUser.brandId) : undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${AUTH_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ IMPORTANT: Required for httpOnly cookies
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      const mappedUser = mapBackendUser(data.user);
      setUser(mappedUser);
      logger.info('User logged in successfully', { userId: mappedUser.id, email: mappedUser.email });
      router.push('/overview');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      logger.error('Login failed', err instanceof Error ? err : new Error(String(err)), {
        email: credentials.email,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const register = useCallback(async (userData: { email: string; password: string; firstName: string; lastName: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${AUTH_BASE}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ IMPORTANT: Required for httpOnly cookies
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      const mappedUser = mapBackendUser(data.user);
      setUser(mappedUser);
      logger.info('User registered successfully', { userId: mappedUser.id, email: mappedUser.email });
      router.push('/overview');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      logger.error('Registration failed', err instanceof Error ? err : new Error(String(err)), {
        email: userData.email,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${AUTH_BASE}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include', // ✅ IMPORTANT: Required for httpOnly cookies
      });
      logger.info('User logged out', { userId: user?.id });
    } catch (err) {
      logger.error('Logout error', err instanceof Error ? err : new Error(String(err)), {
        userId: user?.id,
      });
    } finally {
      setUser(null);
      router.push('/login');
    }
  }, [router, user?.id]);

  useEffect(() => {
    let isMounted = true;

    // Public paths that should NOT trigger auth/me calls to avoid 401 console noise.
    // AuthProvider is mounted at root level, so this prevents useless requests on marketing pages.
    const publicPrefixes = [
      '/', '/solutions', '/pricing', '/about', '/contact', '/blog', '/careers',
      '/developers', '/changelog', '/security', '/status', '/legal', '/help',
      '/features', '/login', '/register', '/forgot-password', '/reset-password',
    ];

    const isPublicPage = (): boolean => {
      if (typeof window === 'undefined') return false;
      const path = window.location.pathname;
      // Exact match for homepage
      if (path === '/') return true;
      // Prefix match for public sections
      return publicPrefixes.some(prefix => prefix !== '/' && path.startsWith(prefix));
    };

    const loadUser = async () => {
      // Skip auth check entirely on public pages — no cookies to send, avoids 401 console errors
      if (isPublicPage()) {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        // httpOnly cookies cannot be read via document.cookie
        // Call /auth/me directly — cookies are sent automatically via credentials: 'include'
        let response = await fetch(`${AUTH_BASE}/api/v1/auth/me`, {
          method: 'GET',
          credentials: 'include', // ✅ IMPORTANT: Required for httpOnly cookies
        });

        if (!isMounted) return;

        // If 401, attempt token refresh before giving up
        if (response.status === 401) {
          try {
            const refreshResp = await fetch(`${AUTH_BASE}/api/v1/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            });

            if (!isMounted) return;

            if (refreshResp.ok) {
              // Retry /auth/me with new cookies (set automatically by browser)
              response = await fetch(`${AUTH_BASE}/api/v1/auth/me`, {
                method: 'GET',
                credentials: 'include',
              });
              if (!isMounted) return;
            }
          } catch {
            // Refresh failed silently, will handle below
          }
        }

        if (!response.ok) {
          if (response.status === 401) {
            // Not authenticated - clear user state (cookies handled by backend)
            setUser(null);
            return;
          }
          throw new Error(`Failed to fetch user: ${response.statusText}`);
        }

        const data = await response.json();
        // Backend may return:
        //   { user: { id, email, ... } }         (login format)
        //   { success: true, data: { id, ... } } (auth/me wrapped format)
        //   { id, email, ... }                    (direct format)
        const userData = data.user || data.data?.user || data.data || data;
        if (userData && userData.id) {
          const mappedUser = mapBackendUser(userData);
          setUser(mappedUser);
          logger.debug('User loaded successfully', { userId: mappedUser.id });
        } else {
          setUser(null);
        }
      } catch (err) {
        logger.warn('Error loading user', { error: err instanceof Error ? err.message : String(err) });
        setUser(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadUser();

    // Poll for user changes every 5 minutes ONLY on authenticated pages
    const intervalId = setInterval(() => {
      if (!isMounted || isPublicPage()) return;
      loadUser();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      // Preserve current path as redirect target so user returns after login
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const redirectParam = currentPath && currentPath !== '/login' ? `?redirect=${encodeURIComponent(currentPath)}` : '';
      router.push(`/login${redirectParam}`);
    }
  }, [user, isLoading, router]);

  return { user, isLoading };
}