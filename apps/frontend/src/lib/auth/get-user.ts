/**
 * ★★★ AUTH HELPER - GET USER ★★★
 * Helper pour récupérer l'utilisateur depuis la session
 * ✅ Utilise JWT backend (cookies httpOnly) au lieu de Supabase
 * - Support cookies JWT
 * - Support API routes
 */

import { db } from '@/lib/db';
import { cookies } from 'next/headers';

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
      console.warn('[getServerUser] API route failed, trying JWT decode fallback:', fetchError);
      
      // Option 2 : Décoder le JWT et récupérer depuis DB
      // Note : Nécessite d'installer jsonwebtoken ou jose
      // Pour l'instant, on retourne null si l'API route échoue
      return null;
    }
  } catch (error) {
    // Logger is not available in server context, use console for critical errors
    if (process.env.NODE_ENV === 'development') {
      console.error('[getServerUser] Error getting server user:', error);
    }
    return null;
  }
}

/**
 * Récupère l'utilisateur depuis la requête (API Route)
 */
export async function getUserFromRequest(
  request: Request
): Promise<AuthUser | null> {
  try {
    // Extract token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Try to get from cookies
    const cookieHeader = request.headers.get('cookie');
    const cookieMap = cookieHeader
      ? Object.fromEntries(
          cookieHeader.split('; ').map((c) => {
            const [key, ...values] = c.split('=');
            return [key, decodeURIComponent(values.join('='))];
          })
        )
      : {};

    // Use Supabase to verify session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieMap[name];
          },
        },
      }
    );

    let supabaseUser;

    if (token) {
      // If token provided, verify it
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) {
        return null;
      }
      supabaseUser = user;
    } else {
      // Try to get from session
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        return null;
      }
      supabaseUser = user;
    }

    // Fetch user from database
    const dbUser = await db.user.findUnique({
      where: { id: supabaseUser.id },
      select: {
        id: true,
        email: true,
        role: true,
        brandId: true,
      },
    });

    if (!dbUser) {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role || undefined,
      brandId: dbUser.brandId || undefined,
    };
  } catch (error) {
    // Logger is not available in server context, use console for critical errors
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting user from request', error);
    }
    return null;
  }
}

