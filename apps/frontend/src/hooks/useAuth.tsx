'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';
import { getBackendUrl } from '@/lib/api/server-url';

import type { AuthContextType, AuthUser } from './types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Base URL - centralized via getBackendUrl()
const API_BASE_URL = getBackendUrl();

/**
 * Map backend user response to AuthUser
 */
const mapBackendUser = (backendUser: Record<string, unknown>): AuthUser => ({
  id: String(backendUser.id ?? ''),
  email: String(backendUser.email ?? ''),
  firstName: String(backendUser.firstName ?? backendUser.first_name ?? ''),
  lastName: String(backendUser.lastName ?? backendUser.last_name ?? ''),
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
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
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
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
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
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
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

    const loadUser = async () => {
      setIsLoading(true);
      try {
        // httpOnly cookies cannot be read via document.cookie
        // Call /auth/me directly — cookies are sent automatically via credentials: 'include'
        let response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          method: 'GET',
          credentials: 'include', // ✅ IMPORTANT: Required for httpOnly cookies
        });

        if (!isMounted) return;

        // If 401, attempt token refresh before giving up
        if (response.status === 401) {
          try {
            const refreshResp = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            });

            if (!isMounted) return;

            if (refreshResp.ok) {
              // Retry /auth/me with new cookies (set automatically by browser)
              response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
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
        // Backend returns user directly or in data.user
        const userData = data.user || data.data?.user || data;
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

    // Poll for user changes every 5 minutes ONLY if user was loaded
    const intervalId = setInterval(() => {
      if (!isMounted) return;
      // Only refresh if we have a user (i.e., they were previously authenticated)
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
      router.push('/login');
    }
  }, [user, isLoading, router]);

  return { user, isLoading };
}