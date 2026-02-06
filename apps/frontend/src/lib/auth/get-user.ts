/**
 * ★★★ AUTH HELPER - GET USER ★★★
 * Helper pour récupérer l'utilisateur depuis la session
 * ✅ Utilise JWT backend (cookies httpOnly) au lieu de Supabase
 * - Support cookies JWT
 * - Support API routes
 */

import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { serverLogger } from '@/lib/logger-server';

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  brandId?: string;
}

/**
 * Récupère l'utilisateur depuis les cookies JWT (backend NestJS)
 * Remplace l'ancienne implémentation Supabase qui était incompatible
 */
export async function getServerUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    
    if (!accessToken) {
      return null;
    }

    // Option 1 : Utiliser l'API route Next.js (recommandé)
    // En Server Component, utiliser l'URL relative (Next.js gère automatiquement)
    // En production Vercel, l'URL relative fonctionne car on est sur le même domaine
    const apiUrl = '/api/auth/me';
    
    try {
      const refreshToken = cookieStore.get('refreshToken')?.value || '';
      const cookieHeader = refreshToken
        ? `accessToken=${accessToken}; refreshToken=${refreshToken}`
        : `accessToken=${accessToken}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Cookie': cookieHeader,
        },
        credentials: 'include',
        cache: 'no-store', // Important : ne pas mettre en cache
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      // Vérifier que les données sont valides
      if (!data || !data.id) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        role: data.role || undefined,
        brandId: data.brandId || undefined,
      };
    } catch (fetchError) {
      // Fallback : Décoder le JWT directement (moins sécurisé mais fonctionne)
      serverLogger.warn('[getServerUser] API route failed, trying JWT decode fallback', { error: fetchError });
      
      // Option 2 : Décoder le JWT et récupérer depuis DB
      // Note : Nécessite d'installer jsonwebtoken ou jose
      // Pour l'instant, on retourne null si l'API route échoue
      return null;
    }
  } catch (error) {
    serverLogger.error('[getServerUser] Error getting server user', error);
    return null;
  }
}

/**
 * Récupère l'utilisateur depuis la requête (API Route)
 * ✅ Utilise JWT backend (cookies httpOnly) au lieu de Supabase
 */
export async function getUserFromRequest(
  request: Request
): Promise<AuthUser | null> {
  try {
    // Extract token from cookies
    const cookieHeader = request.headers.get('cookie');
    const cookieMap = cookieHeader
      ? Object.fromEntries(
          cookieHeader.split('; ').map((c) => {
            const [key, ...values] = c.split('=');
            return [key, decodeURIComponent(values.join('='))];
          })
        )
      : {};

    const accessToken = cookieMap['accessToken'];
    
    if (!accessToken) {
      // Try Authorization header as fallback
      const authHeader = request.headers.get('authorization');
      const bearerToken = authHeader?.replace('Bearer ', '');
      if (!bearerToken) {
        return null;
      }
    }

    // Call backend API to verify token and get user
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.luneo.app';
    const response = await fetch(`${backendUrl}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader || '',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (!data || !data.id) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      role: data.role || undefined,
      brandId: data.brandId || undefined,
    };
  } catch (error) {
    serverLogger.error('[getUserFromRequest] Error getting user from request', error);
    return null;
  }
}

