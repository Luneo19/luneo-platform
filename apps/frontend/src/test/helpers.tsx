/**
 * Helpers de test unitaires - Fonctions réutilisables pour les tests unitaires
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

/**
 * Wrapper avec tous les providers nécessaires
 */
export function AllProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Render helper avec providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Factory pour créer des mocks de service
 */
export function createMockService<T extends Record<string, unknown>>(
  defaults: Partial<T> = {}
): T {
  const mocked = Object.keys(defaults).reduce<Record<string, unknown>>((acc, key) => {
    const value = defaults[key as keyof T];
    if (typeof value === 'function') {
      acc[key] = vi.fn().mockImplementation(value);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
  return mocked as T;
}

/**
 * Factory pour créer des mocks de données
 */
export function createMockData<T>(factory: () => T): T {
  return factory();
}

/**
 * Helper pour attendre qu'un élément soit visible
 */
export async function waitForElement(
  callback: () => HTMLElement | null,
  timeout = 5000
): Promise<HTMLElement> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = callback();
    if (element) {
      return element;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error('Element not found within timeout');
}

/**
 * Helper pour créer un mock de fetch
 */
export function createMockFetch(
  responses: Record<string, unknown> = {}
): typeof fetch {
  return vi.fn((url: string | URL | Request, _init?: RequestInit) => {
    const urlString = typeof url === 'string' ? url : url.toString();
    const response = responses[urlString] ?? responses['*'] ?? { data: {} };
    
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => response,
      text: async () => JSON.stringify(response),
      headers: new Headers(),
    } as Response);
  }) as unknown as typeof fetch;
}

/**
 * Helper pour nettoyer les mocks
 */
export function clearAllMocks() {
  vi.clearAllMocks();
  vi.clearAllTimers();
}

/**
 * Helper pour créer un mock de Next.js router
 */
export function createMockRouter() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  };
}








