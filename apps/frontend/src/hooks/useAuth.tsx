'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

import type { AuthContextType, AuthUser } from './types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // If Supabase is not configured, skip Supabase auth and use backend API instead
  const isSupabaseConfigured = useMemo(() => {
    return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const mapSupabaseUser = useCallback((authUser: any): AuthUser => ({
    id: authUser.id,
    email: authUser.email,
    firstName: authUser.user_metadata?.first_name || authUser.user_metadata?.firstName || '',
    lastName: authUser.user_metadata?.last_name || authUser.user_metadata?.lastName || '',
  }), []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);

    // If Supabase is not configured, use backend API instead
    if (!isSupabaseConfigured || !supabase) {
      try {
        // TODO: Use backend API endpoint instead
        const response = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Login failed');
        }

        const data = await response.json();
        // TODO: Map backend user response to AuthUser
        setUser({
          id: data.user?.id || '',
          email: data.user?.email || credentials.email,
          firstName: data.user?.firstName || '',
          lastName: data.user?.lastName || '',
        });
        router.push('/overview');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Login failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      if (data.user) {
        setUser(mapSupabaseUser(data.user));
        router.push('/overview');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mapSupabaseUser, router, supabase, isSupabaseConfigured]);

  const register = useCallback(async (userData: { email: string; password: string; firstName: string; lastName: string }) => {
    setIsLoading(true);
    setError(null);

    // If Supabase is not configured, use backend API instead
    if (!isSupabaseConfigured || !supabase) {
      try {
        // TODO: Use backend API endpoint instead
        const response = await fetch('/api/v1/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        // TODO: Map backend user response to AuthUser
        setUser({
          id: data.user?.id || '',
          email: data.user?.email || userData.email,
          firstName: data.user?.firstName || userData.firstName,
          lastName: data.user?.lastName || userData.lastName,
        });
        router.push('/overview');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Registration failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (data.user) {
        setUser(mapSupabaseUser(data.user));
        router.push('/overview');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mapSupabaseUser, router, supabase, isSupabaseConfigured]);

  const logout = useCallback(async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      } else {
        // TODO: Call backend logout endpoint
        await fetch('/api/v1/auth/logout', { method: 'POST' });
      }
      logger.info('User logged out', { userId: user?.id });
    } catch (err) {
      logger.error('Logout error', err instanceof Error ? err : new Error(String(err)), {
        userId: user?.id,
      });
    } finally {
      setUser(null);
      router.push('/login');
    }
  }, [router, supabase, isSupabaseConfigured, user?.id]);

  useEffect(() => {
    // Skip Supabase auth if not configured
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      setUser(null);
      return;
    }

    let isMounted = true;

    const loadUser = async () => {
      setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (fetchError) {
          logger.warn('Unable to fetch Supabase user', {
            error: fetchError.message,
            code: fetchError.status,
          });
          setUser(null);
        } else if (data.user) {
          setUser(mapSupabaseUser(data.user));
        } else {
          setUser(null);
        }
      } catch (err) {
        logger.warn('Error loading user', { error: err });
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
    });

    loadUser();

    return () => {
      isMounted = false;
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, [mapSupabaseUser, supabase, isSupabaseConfigured]);

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