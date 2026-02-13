import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints, type AuthSessionResponse } from '../api/client';
import { useRouter } from 'next/navigation';
import type { LoginCredentials, RegisterData, User } from '@/lib/types';
import { logger } from '@/lib/logger';
import { getRoleBasedRedirect } from '@/lib/utils/role-redirect';

/**
 * Hook to get current user
 * ✅ Uses React Query with httpOnly cookies
 */
export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      // httpOnly cookies are sent automatically via withCredentials — no document.cookie check needed
      try {
        return await endpoints.auth.me();
      } catch (error) {
        logger.error('Failed to fetch current user', { error });
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    // Always enabled on client — cookies are sent automatically, 401 = not logged in
    enabled: typeof window !== 'undefined',
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

      // Redirect: prefer ?redirect query param (e.g. /admin/customers), else role-based
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const redirectTo = params.get('redirect');
      const safeRedirect = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : null;
      router.push(safeRedirect || getRoleBasedRedirect(data.user?.role));
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
 * Uses httpOnly cookies - no localStorage needed
 */
export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<AuthSessionResponse, Error, RegisterData>({
    mutationFn: (data: RegisterData) => endpoints.auth.register(data),
    onSuccess: (data) => {
      // Tokens are in httpOnly cookies (set by backend)
      if (data.user) {
        queryClient.setQueryData(['auth', 'me'], data.user);
      }

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
      // Cookies are cleared by backend on logout
      queryClient.clear();
      router.push('/');
    },
    onError: (error: Error) => {
      logger.error('Logout failed', {
        error,
        message: error.message,
      });
      // Force logout even if request fails — cookies may already be expired
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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl && typeof window !== 'undefined' && window.location.protocol === 'https:') {
    logger.error('[CRITICAL] NEXT_PUBLIC_API_URL is not set — OAuth login will fail');
  }
  const baseUrl = apiUrl || 'http://localhost:3001';
  return {
    loginWithGoogle: () => {
      window.location.href = `${baseUrl}/api/v1/auth/google`;
    },
    loginWithGithub: () => {
      window.location.href = `${baseUrl}/api/v1/auth/github`;
    },
  };
}



