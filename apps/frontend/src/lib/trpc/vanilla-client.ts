/**
 * ★★★ VANILLA TRPC CLIENT - POUR SERVICES ★★★
 * Client tRPC vanilla pour utilisation dans les services
 * (en dehors des composants React)
 */

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './routers/_app';
import { logger } from '@/lib/logger';

// ========================================
// CREATE VANILLA CLIENT
// ========================================

export function createVanillaTRPCClient() {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        // Auth tokens are in httpOnly cookies — sent automatically via credentials: 'include'
        // No Authorization header needed
        fetch: async (url, options) => {
          try {
            const response = await fetch(url, {
              ...options,
              credentials: 'include', // Send httpOnly cookies automatically
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              logger.error('tRPC request failed', {
                url,
                status: response.status,
                error: errorText,
              });
            }

            return response;
          } catch (error) {
            logger.error('tRPC fetch error', { url, error });
            throw error;
          }
        },
      }),
    ],
  });
}

// ========================================
// SINGLETON INSTANCE
// ========================================

let vanillaClient: ReturnType<typeof createVanillaTRPCClient> | null = null;

export function getVanillaTRPCClient() {
  if (!vanillaClient) {
    vanillaClient = createVanillaTRPCClient();
  }
  return vanillaClient;
}

// ========================================
// EXPORT
// ========================================

export const trpcVanilla = getVanillaTRPCClient();

