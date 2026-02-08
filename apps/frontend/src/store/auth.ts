import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/lib/types';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';

type AuthUser = Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'avatar' | 'name'> & {
  role: UserRole | 'admin' | 'user';
};

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const data = await endpoints.auth.login({ email, password });
          const userData = data.user;
          if (!userData) {
            throw new Error('Erreur de connexion');
          }
          // Tokens are in httpOnly cookies; clear any legacy localStorage tokens
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
          set({ 
            user: userData as AuthUser, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur de connexion', 
            isLoading: false 
          });
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          const data = await endpoints.auth.signup(userData);
          const newUser = data.user;
          if (!newUser) {
            throw new Error('Erreur lors de l\'inscription');
          }
          // Tokens are in httpOnly cookies; clear any legacy localStorage tokens
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
          set({ 
            user: newUser as AuthUser, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de l\'inscription', 
            isLoading: false 
          });
        }
      },

      logout: async () => {
        try {
          await endpoints.auth.logout();
          logger.info('User logged out');
        } catch (error) {
          logger.error('Logout error', error instanceof Error ? error : new Error(String(error)));
        } finally {
          // Cookies are cleared by backend on logout; clear legacy localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
          }
          set({ 
            user: null, 
            isAuthenticated: false, 
            error: null 
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user: AuthUser | null) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

