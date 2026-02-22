/**
 * tRPC Client - Internal Dashboard API Layer
 *
 * ARCHITECTURE BOUNDARY:
 * - tRPC is used for INTERNAL dashboard pages (type-safe, fast iteration).
 * - REST (@/lib/api/client.ts) is used for:
 *   - Public API endpoints (documented with Swagger)
 *   - Auth flows (login, signup, OAuth callbacks)
 *   - Stripe webhooks and payment flows
 *   - External integrations (Shopify, WooCommerce)
 *
 * RULE: New dashboard features should use tRPC.
 *       New public/external APIs should use REST.
 *       Do NOT duplicate endpoints across both layers.
 */

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import { QueryClient } from '@tanstack/react-query';
import type { AppRouter } from './routers/_app';

// ========================================
// CLIENT TRPC
// ========================================

export const trpc = createTRPCReact<AppRouter>();

// Export as 'api' for backward compatibility
export const api = trpc;

// ========================================
// QUERY CLIENT
// ========================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// ========================================
// TRPC CLIENT CONFIGURATION
// ========================================

export function getTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        // Headers pour auth
        headers: async () => {
          // Auth: httpOnly cookies are sent automatically with same-origin requests
          // No need to read document.cookie — httpOnly cookies are inaccessible to JS
          return {};
        },
      }),
    ],
  });
}

