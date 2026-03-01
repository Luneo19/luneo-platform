/**
 * Tests for Login Page Component
 * Tests critical conversion-flow component: login page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode, ComponentProps } from 'react';
import LoginPage from '../page';

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/login',
}));

// Mock API client
vi.mock('@/lib/api/client', () => ({
  endpoints: {
    auth: {
      login: vi.fn().mockResolvedValue({
        accessToken: 'mock-token',
        user: { id: '1', email: 'test@example.com' },
      }),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock dynamic motion components
vi.mock('@/lib/performance/dynamic-motion', () => ({
  LazyMotionDiv: ({
    children,
    ...props
  }: {
    children: ReactNode;
  } & ComponentProps<'div'>) => <div {...props}>{children}</div>,
}));

// Mock animation components
vi.mock('@/components/animations', () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SlideUp: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock ErrorBoundary
vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock i18n so login page renders expected French text
vi.mock('@/i18n/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'auth.login.welcomeBack': 'Bon retour',
        'auth.login.subtitleLuneo': 'Connectez-vous à votre espace Luneo',
        'auth.login.email': 'Email',
        'auth.login.emailPlaceholder': 'votre@email.com',
        'auth.login.password': 'Password',
        'auth.login.forgotPassword': 'Mot de passe oublié ?',
        'auth.login.rememberMe': 'Se souvenir de moi',
        'auth.login.secureConnection': 'Connexion sécurisée',
        'auth.login.submit': 'Se connecter',
        'auth.login.submitting': 'Connexion...',
        'auth.login.noAccount': 'Pas encore de compte ?',
        'auth.login.createAccount': 'Créer un compte',
        'auth.login.orContinueWith': 'Ou continuer avec',
        'auth.login.securityIndicators.ssl': 'SSL/TLS',
        'auth.login.securityIndicators.twoFA': '2FA disponible',
        'auth.login.securityIndicators.gdpr': 'RGPD',
      };
      return map[key] ?? key;
    },
    locale: 'fr',
    setLocale: () => {},
  }),
}));

// Mock TwoFactorForm component
vi.mock('@/components/auth/TwoFactorForm', () => ({
  TwoFactorForm: ({
    tempToken,
    email,
    onSuccess: _onSuccess,
    onError: _onError,
  }: {
    tempToken: string;
    email: string;
    onSuccess: () => void;
    onError: (error: string) => void;
  }) => (
    <div data-testid="two-factor-form">
      <h2>Two Factor Authentication</h2>
      <p>Token: {tempToken}</p>
      <p>Email: {email}</p>
    </div>
  ),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('should render login page without crashing', () => {
      const { container } = render(<LoginPage />);
      expect(container).toBeTruthy();
    });

    it('should render login title and subtitle', () => {
      render(<LoginPage />);
      
      expect(screen.getByTestId('login-title')).toBeInTheDocument();
      expect(screen.getByText(/bon retour/i)).toBeInTheDocument();
      expect(screen.getByTestId('login-subtitle')).toBeInTheDocument();
      expect(screen.getByText(/connectez-vous [aà] votre espace [Ll]uneo/i)).toBeInTheDocument();
    });

    it('should render email input field', () => {
      render(<LoginPage />);
      
      const emailInput = screen.getByTestId('login-email');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'votre@email.com');
    });

    it('should render password input field', () => {
      render(<LoginPage />);
      
      const passwordInput = screen.getByTestId('login-password');
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('placeholder', '••••••••');
    });

    it('should render submit button', () => {
      render(<LoginPage />);
      
      const submitButton = screen.getByTestId('login-submit');
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveTextContent(/se connecter/i);
    });

    it('should render forgot password link', () => {
      render(<LoginPage />);
      
      const forgotPasswordLink = screen.getByText(/mot de passe oublié/i);
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
    });

    it('should render social login buttons', () => {
      render(<LoginPage />);
      
      // Check for Google and GitHub buttons
      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
    });

    it('should render register link', () => {
      render(<LoginPage />);
      
      const registerLink = screen.getByTestId('login-switch-register');
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveTextContent(/créer un compte/i);
      expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
    });

    it('should render remember me checkbox', () => {
      render(<LoginPage />);
      
      const rememberCheckbox = screen.getByTestId('login-remember');
      expect(rememberCheckbox).toBeInTheDocument();
      expect(rememberCheckbox).toHaveAttribute('type', 'checkbox');
    });

    it('should render password toggle button', () => {
      render(<LoginPage />);
      
      const toggleButton = screen.getByTestId('login-toggle-password');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should render security indicators', () => {
      render(<LoginPage />);
      
      expect(screen.getByText(/ssl\/tls/i)).toBeInTheDocument();
      expect(screen.getByText(/2fa disponible/i)).toBeInTheDocument();
      expect(screen.getByText(/rgpd/i)).toBeInTheDocument();
    });
  });

  describe('Form State', () => {
    it('should disable submit button when form is empty', () => {
      render(<LoginPage />);
      
      const submitButton = screen.getByTestId('login-submit');
      // Button should be disabled when email or password is empty
      expect(submitButton).toBeDisabled();
    });
  });
});
