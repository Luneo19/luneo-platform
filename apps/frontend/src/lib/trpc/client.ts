/**
 * ★★★ CLIENT TRPC - CONFIGURATION COMPLÈTE ★★★
 * Client tRPC pour React avec:
 * - React Query integration
 * - Error handling
 * - Type safety
 */

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import { QueryClient } from '@tanstack/react-query';
import type { AppRouter } from './routers/_app';

// ========================================
// CLIENT TRPC
// ========================================

export const trpc = createTRPCReact<AppRouter>();

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
          // Récupérer token depuis session/cookies
          if (typeof window !== 'undefined') {
            // Client-side: get from localStorage or cookies
            const token = localStorage.getItem('supabase.auth.token') || 
                         document.cookie
                           .split('; ')
                           .find((row) => row.startsWith('sb-'))
                           ?.split('=')[1];

            if (token) {
              return {
                Authorization: `Bearer ${token}`,
              };
            }
          }

          return {};
        },
      }),
    ],
  });
}

