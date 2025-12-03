/**
 * @file useAuth.test.tsx
 * @description Tests complets pour le hook useAuth
 * @task T-006
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
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
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

// ============================================
// TEST DATA
// ============================================

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: {
    first_name: 'John',
    last_name: 'Doe',
  },
};

const mockSession = {
  user: mockUser,
  access_token: 'mock-token',
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
      <button onClick={handleLogin}>
        Login
      </button>
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
  
  // Default mock implementations
  mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
  mockSignInWithPassword.mockResolvedValue({ data: { user: mockUser }, error: null });
  mockSignUp.mockResolvedValue({ data: { user: mockUser }, error: null });
  mockSignOut.mockResolvedValue({ error: null });
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
      // Suppress console.error for this test
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
      mockGetUser.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    });

    it('loads user from session on mount', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
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
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
      
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

    it('handles error fetching user', async () => {
      mockGetUser.mockResolvedValue({ 
        data: { user: null }, 
        error: { message: 'Session expired', status: 401 } 
      });
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
      
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });
  });

  describe('Login', () => {
    it('successfully logs in user', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
      
      await user.click(screen.getByText('Login'));
      
      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/overview');
      });
    });

    it('handles login error', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' },
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
      
      // Click login button - the error is thrown by login function but caught internally
      await user.click(screen.getByText('Login'));
      
      // Wait for error to be set in state
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      }, { timeout: 3000 });
    });

    it('sets loading state during login', async () => {
      // Use a delay to simulate loading state
      mockSignInWithPassword.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: { user: mockUser }, error: null };
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
      
      // Start login (don't await - we want to check loading state)
      const loginPromise = user.click(screen.getByText('Login'));
      
      // Loading should become true
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loading');
      }, { timeout: 500 });
      
      // Wait for login to complete
      await loginPromise;
      
      // Loading should be false again
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
    });
  });

  describe('Logout', () => {
    it('successfully logs out user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });
      
      await user.click(screen.getByText('Logout'));
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });
      
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('handles logout error gracefully', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSignOut.mockRejectedValue(new Error('Network error'));
      
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });
      
      await user.click(screen.getByText('Logout'));
      
      // Should still clear user and redirect even on error
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });
      
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Auth State Changes', () => {
    it('updates user on auth state change', async () => {
      let authStateCallback: ((event: string, session: any) => void) | null = null;
      
      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
      
      // Initially no user
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      
      // Simulate auth state change
      act(() => {
        authStateCallback?.('SIGNED_IN', { user: mockUser });
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });
    });

    it('clears user on sign out event', async () => {
      let authStateCallback: ((event: string, session: any) => void) | null = null;
      
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });
      
      // Simulate sign out event
      act(() => {
        authStateCallback?.('SIGNED_OUT', null);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });
    });
  });

  describe('Error Handling', () => {
    it('clears error with clearError', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' },
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
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
      
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
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
      render(
        <AuthProvider>
          <RequireAuthTestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('require-user')).toHaveTextContent('test@example.com');
      });
      
      // Should not have called push with /login
      expect(mockPush).not.toHaveBeenCalledWith('/login');
    });

    it('does not redirect while loading', async () => {
      mockGetUser.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(
        <AuthProvider>
          <RequireAuthTestComponent />
        </AuthProvider>
      );
      
      expect(screen.getByTestId('require-loading')).toHaveTextContent('loading');
      
      // Should not redirect while loading
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('User Metadata Mapping', () => {
    it('maps first_name and last_name correctly', async () => {
      const userWithMetadata = {
        ...mockUser,
        user_metadata: {
          first_name: 'Jane',
          last_name: 'Smith',
        },
      };
      
      mockGetUser.mockResolvedValue({ data: { user: userWithMetadata }, error: null });
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('Jane Smith');
      });
    });

    it('maps firstName and lastName alternatives', async () => {
      const userWithAltMetadata = {
        ...mockUser,
        user_metadata: {
          firstName: 'Bob',
          lastName: 'Johnson',
        },
      };
      
      mockGetUser.mockResolvedValue({ data: { user: userWithAltMetadata }, error: null });
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('Bob Johnson');
      });
    });

    it('handles missing metadata gracefully', async () => {
      const userWithoutMetadata = {
        id: 'user-456',
        email: 'no-name@example.com',
        user_metadata: {},
      };
      
      mockGetUser.mockResolvedValue({ data: { user: userWithoutMetadata }, error: null });
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-name@example.com');
      });
      
      // Name should be empty strings
      expect(screen.getByTestId('user-name').textContent?.trim()).toBe('');
    });
  });

  describe('Cleanup', () => {
    it('unsubscribes from auth state changes on unmount', async () => {
      const unsubscribeMock = vi.fn();
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: unsubscribeMock } },
      });
      
      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
      
      unmount();
      
      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });
});

