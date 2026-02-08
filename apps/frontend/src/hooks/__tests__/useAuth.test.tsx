/**
 * @file useAuth.test.tsx
 * @description Tests for the useAuth hook (NestJS backend auth, no Supabase)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth, useRequireAuth } from '../useAuth';

// ============================================
// MOCKS
// ============================================

const mockPush = vi.fn();

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock endpoints
vi.mock('@/lib/api/client', () => ({
  endpoints: {
    auth: {
      me: vi.fn(),
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    },
  },
}));

// ============================================
// SETUP
// ============================================

// Mock fetch globally for the hook (which uses fetch directly, not endpoints)
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
};

// ============================================
// TEST COMPONENTS
// ============================================

function TestComponent() {
  const { user, isAuthenticated, isLoading, error, login, logout, clearError } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login({ email: 'test@example.com', password: 'password123' });
    } catch {
      // Error is handled internally by useAuth and stored in error state
    }
  };
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="user-name">{user ? `${user.firstName} ${user.lastName}` : 'no-name'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <button onClick={handleLogin}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={clearError}>Clear Error</button>
    </div>
  );
}

function RequireAuthTestComponent() {
  const { user, isLoading } = useRequireAuth();
  
  return (
    <div>
      <div data-testid="require-loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="require-user">{user ? user.email : 'no-user'}</div>
    </div>
  );
}

// ============================================
// SETUP & TEARDOWN
// ============================================

beforeEach(() => {
  vi.clearAllMocks();
  
  // Default: /auth/me returns no user (not logged in)
  mockFetch.mockResolvedValue({
    ok: false,
    status: 401,
    json: async () => ({ message: 'Unauthorized' }),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================
// TESTS
// ============================================

describe('useAuth Hook', () => {
  describe('Context & Provider', () => {
    it('throws error when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');
      
      consoleSpy.mockRestore();
    });

    it('provides auth context to children', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
      
      expect(screen.getByTestId('authenticated')).toBeInTheDocument();
      expect(screen.getByTestId('user')).toBeInTheDocument();
    });
  });

  describe('Initial State', () => {
    it('starts with loading state', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    });

    it('loads user from session on mount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockUser,
      });
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });
      
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
    });

    it('handles no user session', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
      
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });
  });

  describe('Login', () => {
    it('successfully logs in user', async () => {
      // Initial mount: no user
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });
      
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
      
      // Login request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      });
      
      await user.click(screen.getByText('Login'));
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/overview');
      });
    });

    it('handles login error', async () => {
      // Initial mount: no user
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });
      
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
      
      // Login fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' }),
      });
      
      await user.click(screen.getByText('Login'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      }, { timeout: 3000 });
    });
  });

  describe('Logout', () => {
    it('successfully logs out user', async () => {
      // Initial mount: user logged in
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });
      
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });
      
      // Logout
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      
      await user.click(screen.getByText('Logout'));
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });
      
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Error Handling', () => {
    it('clears error with clearError', async () => {
      // Initial mount: no user
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });
      
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
      
      // Trigger error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' }),
      });
      
      await user.click(screen.getByText('Login'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      }, { timeout: 3000 });
      
      // Clear error
      await user.click(screen.getByText('Clear Error'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      });
    });
  });

  describe('useRequireAuth Hook', () => {
    it('redirects to login when not authenticated', async () => {
      render(
        <AuthProvider>
          <RequireAuthTestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('require-loading')).toHaveTextContent('not-loading');
      });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('does not redirect when authenticated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });
      
      render(
        <AuthProvider>
          <RequireAuthTestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('require-user')).toHaveTextContent('test@example.com');
      });
      
      expect(mockPush).not.toHaveBeenCalledWith('/login');
    });
  });
});
