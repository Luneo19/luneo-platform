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
    refresh: vi.fn(),
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

// Mock IntersectionObserver (not available in jsdom)
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  constructor(private callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
  observe(_target: Element): void {
    // Immediately trigger with isIntersecting: true for test convenience
    this.callback(
      [{ isIntersecting: true, intersectionRatio: 1, target: _target, boundingClientRect: {} as DOMRectReadOnly, intersectionRect: {} as DOMRectReadOnly, rootBounds: null, time: Date.now() }] as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    );
  }
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}
Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: MockIntersectionObserver });
Object.defineProperty(global, 'IntersectionObserver', { writable: true, value: MockIntersectionObserver });

// Mock ResizeObserver (not available in jsdom)
class MockResizeObserver {
  constructor(private _callback: ResizeObserverCallback) {}
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
Object.defineProperty(window, 'ResizeObserver', { writable: true, value: MockResizeObserver });
Object.defineProperty(global, 'ResizeObserver', { writable: true, value: MockResizeObserver });

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
// API client is mocked per test file (auth.store.test, dashboard.store.test, industry.store.test, onboarding.store.test)
// so that client.test.ts can test the real client.