import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/lib/types';
import { logger } from '@/lib/logger';

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
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Erreur de connexion');
          }

          const { user: userData } = await response.json();
          
          // Tokens are now in httpOnly cookies, no need to store in localStorage
          // Cookies are automatically sent with each request via withCredentials: true
          
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
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Erreur lors de l\'inscription');
          }

          const { user: newUser } = await response.json();
          
          // Tokens are now in httpOnly cookies, no need to store in localStorage
          // Cookies are automatically sent with each request via withCredentials: true
          
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
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('accessToken') : ''}`,
            },
          });
          logger.info('User logged out');
        } catch (error) {
          logger.error('Logout error', error instanceof Error ? error : new Error(String(error)));
        } finally {
          // Cookies are cleared by backend on logout
          // No need to manually remove from localStorage
          
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

