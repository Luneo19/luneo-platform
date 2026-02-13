/**
 * Tests RegisterForm/RegisterPage Component
 * T-008: Tests pour RegisterForm component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AllProviders } from '../utils/test-utils';
import { generateTestEmail } from '../fixtures';

// Mock du module Supabase
const mockSignUp = vi.fn();
const mockSignInWithOAuth = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: mockSignUp,
      signInWithOAuth: mockSignInWithOAuth,
    },
  })),
}));

// Mock du router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/register',
  useSearchParams: () => new URLSearchParams(),
}));

// Import dynamique pour permettre les mocks
const loadRegisterPage = async () => {
  // eslint-disable-next-line @next/next/no-assign-module-variable
  const registerModule = await import('@/app/(auth)/register/page');
  return registerModule.default;
};

describe('RegisterForm/RegisterPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUp.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    });
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });
  });

  // ============================================
  // RENDERING TESTS
  // ============================================

  describe('Rendering', () => {
    it('should render registration page', async () => {
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      // Page should render without crashing
      expect(document.body).toBeTruthy();
    });

    it('should render email input field', async () => {
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      const emailInput = screen.getByTestId('register-email');
      expect(emailInput).toBeInTheDocument();
    });

    it('should render password input field', async () => {
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      const passwordInput = screen.getByTestId('register-password');
      expect(passwordInput).toBeInTheDocument();
    });

    it('should render confirm password input field', async () => {
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      const confirmPasswordInput = screen.getByTestId('register-confirm-password');
      expect(confirmPasswordInput).toBeInTheDocument();
    });

    it('should render submit button', async () => {
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      const submitButton = screen.getByTestId('register-submit');
      expect(submitButton).toBeInTheDocument();
    });

    it('should render name input field', async () => {
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      const nameInput = screen.getByTestId('register-name');
      expect(nameInput).toBeInTheDocument();
    });
  });

  // ============================================
  // FORM INTERACTION TESTS
  // ============================================

  describe('Form Interactions', () => {
    it('should allow typing in email field', async () => {
      const user = userEvent.setup();
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      const emailInput = screen.getByTestId('register-email');
      await user.type(emailInput, 'test@example.com');
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should allow typing in password field', async () => {
      const user = userEvent.setup();
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      const passwordInput = screen.getByTestId('register-password');
      await user.type(passwordInput, 'TestPassword123!');
      
      expect(passwordInput).toHaveValue('TestPassword123!');
    });

    it('should allow typing in confirm password field', async () => {
      const user = userEvent.setup();
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      const confirmInput = screen.getByTestId('register-confirm-password');
      await user.type(confirmInput, 'TestPassword123!');
      
      expect(confirmInput).toHaveValue('TestPassword123!');
    });

    it('should allow typing in name field', async () => {
      const user = userEvent.setup();
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      const nameInput = screen.getByTestId('register-name');
      await user.type(nameInput, 'Test User');
      
      expect(nameInput).toHaveValue('Test User');
    });
  });

  // ============================================
  // VALIDATION TESTS
  // ============================================

  describe('Form Validation', () => {
    it('should have required email field', async () => {
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      const emailInput = screen.getByTestId('register-email');
      expect(emailInput).toHaveAttribute('required');
    });

    it('should have required password field', async () => {
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      const passwordInput = screen.getByTestId('register-password');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should have email type for email field', async () => {
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      const emailInput = screen.getByTestId('register-email');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should have password type for password field', async () => {
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      const passwordInput = screen.getByTestId('register-password');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  // ============================================
  // PASSWORD MATCHING TESTS
  // ============================================

  describe('Password Matching', () => {
    it('should accept matching passwords', async () => {
      const user = userEvent.setup();
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      const passwordInput = screen.getByTestId('register-password');
      const confirmInput = screen.getByTestId('register-confirm-password');
      
      await user.type(passwordInput, 'TestPassword123!');
      await user.type(confirmInput, 'TestPassword123!');
      
      expect(passwordInput).toHaveValue('TestPassword123!');
      expect(confirmInput).toHaveValue('TestPassword123!');
    });
  });

  // ============================================
  // OAUTH TESTS
  // ============================================

  describe('OAuth Registration', () => {
    it('should render Google OAuth button', async () => {
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      const googleButton = screen.getByTestId('register-oauth-google');
      expect(googleButton).toBeInTheDocument();
    });

    it('should render GitHub OAuth button', async () => {
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      const githubButton = screen.getByTestId('register-oauth-github');
      expect(githubButton).toBeInTheDocument();
    });
  });

  // ============================================
  // ACCESSIBILITY TESTS
  // ============================================

  describe('Accessibility', () => {
    it('should have accessible form fields with ids', async () => {
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      const emailInput = screen.getByTestId('register-email');
      const passwordInput = screen.getByTestId('register-password');
      
      expect(emailInput.id).toBeTruthy();
      expect(passwordInput.id).toBeTruthy();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      await user.tab();
      
      const focused = document.activeElement;
      expect(['INPUT', 'BUTTON', 'A', 'TEXTAREA']).toContain(focused?.tagName);
    });
  });

  // ============================================
  // RESPONSIVE TESTS
  // ============================================

  describe('Responsive Design', () => {
    it('should render on mobile viewport', async () => {
      window.innerWidth = 375;
      window.innerHeight = 667;
      
      const RegisterPage = await loadRegisterPage();
      render(<RegisterPage />, { wrapper: AllProviders });
      
      const submitButton = screen.getByTestId('register-submit');
      expect(submitButton).toBeInTheDocument();
    });
  });
});
