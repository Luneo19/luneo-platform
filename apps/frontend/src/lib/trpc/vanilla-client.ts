/**
 * ★★★ VANILLA TRPC CLIENT - POUR SERVICES ★★★
 * Client tRPC vanilla pour utilisation dans les services
 * (en dehors des composants React)
 */

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './routers/_app';
import { logger } from '@/lib/logger';

// ========================================
// GET AUTH TOKEN
// ========================================

function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Try localStorage first
  const token = localStorage.getItem('accessToken');
  if (token) {
    return token;
  }

  // Try sessionStorage
  const sessionToken = sessionStorage.getItem('accessToken');
  if (sessionToken) {
    return sessionToken;
  }

  // Try cookies (if using cookie-based auth)
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'accessToken' || name === 'auth-token') {
      return value;
    }
  }

  return null;
}

// ========================================
// CREATE VANILLA CLIENT
// ========================================

export function createVanillaTRPCClient() {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        headers: async () => {
          const token = getAuthToken();
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };

          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          return headers;
        },
        fetch: async (url, options) => {
          try {
            const response = await fetch(url, options);
            
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

