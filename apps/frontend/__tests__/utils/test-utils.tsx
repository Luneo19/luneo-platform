/**
 * Test Utilities
 * Helpers pour les tests React avec les providers nécessaires
 */

/// <reference types="vitest/globals" />
import React, { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ============================================
// PROVIDERS WRAPPER
// ============================================

interface AllProvidersProps {
  children: ReactNode;
}

/**
 * Wrapper avec tous les providers nécessaires pour les tests
 */
export function AllProviders({ children }: AllProvidersProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
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

// ============================================
// CUSTOM RENDER
// ============================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRouterState?: {
    pathname?: string;
    query?: Record<string, string>;
  };
}

/**
 * Custom render qui inclut tous les providers
 */
function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const user = userEvent.setup();
  
  return {
    user,
    ...render(ui, { wrapper: AllProviders, ...options }),
  };
}

// ============================================
// MOCK DATA FACTORIES
// ============================================

/**
 * Créer un utilisateur mock
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatar_url: null,
    company: 'Test Company',
    role: 'user',
    subscription_tier: 'starter',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Créer un design mock
 */
export function createMockDesign(overrides = {}) {
  return {
    id: 'design-123',
    name: 'Test Design',
    description: 'A test design',
    preview_url: 'https://example.com/preview.png',
    status: 'completed',
    user_id: 'user-123',
    product_id: 'product-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Créer un produit mock
 */
export function createMockProduct(overrides = {}) {
  return {
    id: 'product-123',
    name: 'Test Product',
    description: 'A test product',
    price: 29.99,
    currency: 'EUR',
    images: ['https://example.com/product.png'],
    is_active: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Créer une session mock
 */
export function createMockSession(overrides = {}) {
  return {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'mock-refresh-token',
    user: createMockUser(),
    ...overrides,
  };
}

// ============================================
// ASYNC UTILITIES
// ============================================

/**
 * Attendre un certain temps (utile pour les animations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Attendre que toutes les promises soient résolues
 */
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

// ============================================
// FORM UTILITIES
// ============================================

/**
 * Remplir un formulaire rapidement
 */
export async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  fields: Record<string, string>
) {
  for (const [label, value] of Object.entries(fields)) {
    const input = document.querySelector(`[name="${label}"], [aria-label="${label}"]`);
    if (input) {
      await user.clear(input as Element);
      await user.type(input as Element, value);
    }
  }
}

// ============================================
// ASSERTIONS UTILITIES
// ============================================

/**
 * Vérifier qu'un élément n'a pas d'erreurs d'accessibilité basiques
 */
export function expectAccessibleElement(element: HTMLElement) {
  // Vérifier qu'il y a un label ou aria-label
  const hasLabel = 
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.closest('label');
  
  if (element.tagName === 'BUTTON' || element.tagName === 'A' || element.tagName === 'INPUT') {
    expect(hasLabel || element.textContent).toBeTruthy();
  }
}

// ============================================
// RE-EXPORTS
// ============================================

export * from '@testing-library/react';
export { userEvent };
export { customRender as render };

