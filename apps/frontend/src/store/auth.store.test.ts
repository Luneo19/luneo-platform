import { describe, it, expect, vi, beforeEach } from 'vitest';
import { endpoints } from '@/lib/api/client';
import { useAuthStore } from './auth';

vi.mock('@/lib/api/client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
  endpoints: {
    auth: {
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      me: vi.fn(),
    },
  },
}));

const mockEndpoints = vi.mocked(endpoints);

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  avatar: null,
  name: 'Test User',
  role: 'user' as const,
};

describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
    mockEndpoints.auth.login.mockResolvedValue({ user: mockUser });
    mockEndpoints.auth.signup.mockResolvedValue({ user: mockUser });
    mockEndpoints.auth.logout.mockResolvedValue(undefined);
  });

  describe('login', () => {
    it('sets user and isAuthenticated on success', async () => {
      const { login } = useAuthStore.getState();
      await login('test@example.com', 'password');
      expect(mockEndpoints.auth.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('login failure', () => {
    it('handles error and clears user', async () => {
      mockEndpoints.auth.login.mockRejectedValueOnce(new Error('Invalid credentials'));
      const { login } = useAuthStore.getState();
      await login('test@example.com', 'wrong');
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().error).toBe('Invalid credentials');
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('handles missing user in response', async () => {
      mockEndpoints.auth.login.mockResolvedValueOnce({ user: null });
      const { login } = useAuthStore.getState();
      await login('test@example.com', 'password');
      expect(useAuthStore.getState().error).toBe('Erreur de connexion');
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears user and tokens', async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      const { logout } = useAuthStore.getState();
      await logout();
      expect(mockEndpoints.auth.logout).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('is handled by API client; store reflects user state', async () => {
      const { setUser } = useAuthStore.getState();
      setUser(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when user exists', async () => {
      const { login } = useAuthStore.getState();
      await login('test@example.com', 'password');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('returns false when user is null', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('getUser', () => {
    it('returns current user data after login', async () => {
      const { login } = useAuthStore.getState();
      await login('test@example.com', 'password');
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().user?.email).toBe('test@example.com');
      expect(useAuthStore.getState().user?.firstName).toBe('Test');
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      useAuthStore.setState({ error: 'Some error' });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('setUser', () => {
    it('sets user and isAuthenticated', () => {
      const { setUser } = useAuthStore.getState();
      setUser(mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      setUser(null);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});
