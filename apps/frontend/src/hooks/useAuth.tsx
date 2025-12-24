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
  }, [mapSupabaseUser, router, supabase.auth]);

  const register = useCallback(async (userData: { email: string; password: string; firstName: string; lastName: string }) => {
    setIsLoading(true);
    setError(null);

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
  }, [mapSupabaseUser, router, supabase.auth]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      logger.info('User logged out', { userId: user?.id });
    } catch (err) {
      logger.error('Logout error', err instanceof Error ? err : new Error(String(err)), {
        userId: user?.id,
      });
    } finally {
      setUser(null);
      router.push('/login');
    }
  }, [router, supabase.auth, user?.id]);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      setIsLoading(true);
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
      setIsLoading(false);
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
      listener.subscription.unsubscribe();
    };
  }, [mapSupabaseUser, supabase.auth]);

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