import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginForm, RegisterForm } from '@/types';
import { authApi } from '@/services/api';
import * as LocalAuthentication from 'expo-local-authentication';

interface AuthState {
  // État
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  biometricsEnabled: boolean;
  
  // Actions
  login: (credentials: LoginForm) => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  
  // Biometrics
  enableBiometrics: () => Promise<boolean>;
  authenticateWithBiometrics: () => Promise<boolean>;
  checkBiometricsSupport: () => Promise<{
    hasHardware: boolean;
    isEnrolled: boolean;
    supportedTypes: boolean;
  }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      biometricsEnabled: false,

      // Actions d'authentification
      login: async (credentials: LoginForm) => {
        set({ isLoading: true, error: null });
        
        try {
          const { user } = await authApi.login(credentials);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Activer la biométrie si demandé
          if (credentials.biometric) {
            await get().enableBiometrics();
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Erreur de connexion',
          });
          throw error;
        }
      },

      register: async (userData: RegisterForm) => {
        set({ isLoading: true, error: null });
        
        try {
          const { user } = await authApi.register(userData);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Erreur d\'inscription',
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authApi.logout();
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            biometricsEnabled: false,
          });
        } catch (error: any) {
          // Même en cas d'erreur, on déconnecte localement
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            biometricsEnabled: false,
          });
        }
      },

      refreshUser: async () => {
        if (!get().isAuthenticated) return;
        
        try {
          const user = await authApi.getCurrentUser();
          set({ user });
        } catch (error: any) {
          console.error('Failed to refresh user:', error);
          // En cas d'erreur, on déconnecte
          await get().logout();
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // Actions biométriques
      enableBiometrics: async () => {
        try {
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();
          
          if (!hasHardware || !isEnrolled) {
            return false;
          }

          set({ biometricsEnabled: true });
          return true;
        } catch (error) {
          console.error('Failed to enable biometrics:', error);
          return false;
        }
      },

      authenticateWithBiometrics: async () => {
        try {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authentifiez-vous pour accéder à Luneo',
            cancelLabel: 'Annuler',
            fallbackLabel: 'Utiliser le mot de passe',
          });

          return result.success;
        } catch (error) {
          console.error('Biometric authentication failed:', error);
          return false;
        }
      },

      checkBiometricsSupport: async () => {
        try {
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();
          const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
          
          return {
            hasHardware,
            isEnrolled,
            supportedTypes: supportedTypes.length > 0,
          };
        } catch (error) {
          console.error('Failed to check biometrics support:', error);
          return {
            hasHardware: false,
            isEnrolled: false,
            supportedTypes: false,
          };
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        biometricsEnabled: state.biometricsEnabled,
      }),
    }
  )
);


