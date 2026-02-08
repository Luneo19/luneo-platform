/**
 * Test setup file for Vitest
 * Configures testing environment and mocks
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
  mockCookiesStore.clear();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js headers (cookies)
const mockCookiesStore = new Map<string, string>();

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn((name: string) => {
      const value = mockCookiesStore.get(name);
      return value ? { name, value } : undefined;
    }),
    set: vi.fn((name: string, value: string) => {
      mockCookiesStore.set(name, value);
    }),
    delete: vi.fn((name: string) => {
      mockCookiesStore.delete(name);
    }),
    has: vi.fn((name: string) => mockCookiesStore.has(name)),
    getAll: vi.fn(() => Array.from(mockCookiesStore.entries()).map(([name, value]) => ({ name, value }))),
  })),
  headers: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(() => false),
    getAll: vi.fn(() => []),
  })),
}));

// Mock tRPC - Mock complet pour tous les routers
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    product: {
      getById: {
        useQuery: vi.fn(() => ({ data: null, isLoading: false, isPending: false })),
      },
      list: {
        useQuery: vi.fn(() => ({ data: [], isLoading: false, isPending: false })),
      },
    },
    customization: {
      generateFromPrompt: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
          isPending: false,
          isError: false,
          error: null,
        })),
      },
      checkStatus: {
        useQuery: vi.fn(() => ({ data: null, isLoading: false, isPending: false })),
      },
      getById: {
        useQuery: vi.fn(() => ({ data: null, isLoading: false, isPending: false })),
      },
    },
    order: {
      create: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
          isPending: false,
        })),
      },
      list: {
        useQuery: vi.fn(() => ({ data: [], isLoading: false, isPending: false })),
      },
    },
    billing: {
      getSubscription: {
        useQuery: vi.fn(() => ({ data: null, isLoading: false, isPending: false })),
      },
    },
    notification: {
      list: {
        useQuery: vi.fn(() => ({ 
          data: { notifications: [], unreadCount: 0 }, 
          isLoading: false, 
          isPending: false,
          refetch: vi.fn(),
        })),
      },
      markAsRead: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
          isPending: false,
        })),
      },
      markAllAsRead: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
          isPending: false,
        })),
      },
      delete: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
          isPending: false,
        })),
      },
    },
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Supabase has been fully removed. Auth is now cookie-based via NestJS backend.
// Mock the API client for tests
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
      login: vi.fn().mockResolvedValue({ user: null }),
      signup: vi.fn().mockResolvedValue({ user: null }),
      logout: vi.fn().mockResolvedValue(undefined),
      me: vi.fn().mockResolvedValue(null),
    },
    credits: {
      balance: vi.fn().mockResolvedValue({ balance: 0 }),
    },
  },
}));