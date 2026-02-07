import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints, type AuthSessionResponse } from '../api/client';
import { useRouter } from 'next/navigation';
import type { LoginCredentials, RegisterData, User } from '@/lib/types';
import { logger } from '@/lib/logger';

/**
 * Hook to get current user
 * ✅ Uses React Query with httpOnly cookies
 */
export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      // ✅ FIX: Vérifier la présence d'un token AVANT d'appeler /auth/me
      // Évite les requêtes 401 inutiles quand personne n'est connecté
      if (typeof window !== 'undefined') {
        const hasToken = 
          localStorage.getItem('accessToken') ||
          localStorage.getItem('token') ||
          document.cookie.includes('accessToken') ||
          document.cookie.includes('refreshToken');
        if (!hasToken) {
          throw new Error('No auth token found');
        }
      }
      try {
        return await endpoints.auth.me();
      } catch (error) {
        logger.error('Failed to fetch current user', { error });
        throw error;
      }
    },
    retry: false, // Ne pas retry sur 401 pour éviter les boucles
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch quand la fenêtre redevient active
    enabled: typeof window !== 'undefined' && Boolean(
      (typeof localStorage !== 'undefined' && (localStorage.getItem('accessToken') || localStorage.getItem('token'))) ||
      (typeof document !== 'undefined' && (document.cookie.includes('accessToken') || document.cookie.includes('refreshToken')))
    ),
  });
}

/**
 * Hook for login mutation
 * ✅ Uses httpOnly cookies - no localStorage needed
 */
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<AuthSessionResponse, Error, LoginCredentials>({
    mutationFn: (credentials: LoginCredentials) => endpoints.auth.login(credentials),
    onSuccess: (data) => {
      // ✅ Tokens are in httpOnly cookies (set by backend)
      // Cookies are automatically sent with each request via withCredentials: true
      // No need to store in localStorage - backend handles auth via cookies
      
      // Store user data in React Query cache only
      if (data.user) {
        queryClient.setQueryData(['auth', 'me'], data.user);
      }

      // Cleanup any old localStorage tokens (migration from old system)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      // Redirect to overview
      router.push('/overview');
    },
    onError: (error) => {
      logger.error('Login failed', {
        error,
        message: error.message,
      });
    },
  });
}

/**
 * Hook for register mutation
 * ✅ Uses httpOnly cookies - no localStorage needed
 */
export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<AuthSessionResponse, Error, RegisterData>({
    mutationFn: (data: RegisterData) => endpoints.auth.register(data),
    onSuccess: (data) => {
      // ✅ Tokens are in httpOnly cookies (set by backend)
      // Cookies are automatically sent with each request via withCredentials: true
      // No need to store in localStorage - backend handles auth via cookies
      
      // Store user data in React Query cache only
      if (data.user) {
        queryClient.setQueryData(['auth', 'me'], data.user);
      }

      // Cleanup any old localStorage tokens (migration from old system)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      // Redirect to overview
      router.push('/overview');
    },
    onError: (error) => {
      logger.error('Registration failed', {
        error,
        message: error.message,
      });
    },
  });
}

/**
 * Hook for logout mutation
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => endpoints.auth.logout(),
    onSuccess: () => {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('brandId');

      // Clear all queries
      queryClient.clear();

      // Redirect to home
      router.push('/');
    },
    onError: (error: any) => {
      logger.error('Logout failed', {
        error,
        message: error.message,
      });
      
      // Force logout even if request fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      queryClient.clear();
      router.push('/');
    },
  });
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
  const { data: user, isLoading } = useCurrentUser();
  return {
    isAuthenticated: !!user && !isLoading,
    isLoading,
    user,
  };
}

/**
 * Hook for OAuth login
 */
export function useOAuthLogin() {
  return {
    loginWithGoogle: () => {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`;
    },
    loginWithGithub: () => {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/github`;
    },
  };
}



