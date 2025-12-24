import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints, type AuthSessionResponse } from '../api/client';
import { useRouter } from 'next/navigation';
import type { LoginCredentials, RegisterData, User } from '@/lib/types';
import { logger } from '@/lib/logger';

/**
 * Hook to get current user
 */
export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: () => endpoints.auth.me(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for login mutation
 */
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<AuthSessionResponse, Error, LoginCredentials>({
    mutationFn: (credentials: LoginCredentials) => endpoints.auth.login(credentials),
    onSuccess: (data) => {
      // Store access token
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      
      // Store user data
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        queryClient.setQueryData(['auth', 'me'], data.user);
      }

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
 */
export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<AuthSessionResponse, Error, RegisterData>({
    mutationFn: (data: RegisterData) => endpoints.auth.register(data),
    onSuccess: (data) => {
      // Store access token
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      
      // Store user data
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
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
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
    },
    loginWithGithub: () => {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/github`;
    },
  };
}



