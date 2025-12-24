/**
 * ★★★ AUTH HELPER - GET USER ★★★
 * Helper pour récupérer l'utilisateur depuis la session
 * - Support Supabase
 * - Support cookies/session
 * - Support API routes
 */

import { db } from '@/lib/db';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  brandId?: string;
}

/**
 * Récupère l'utilisateur depuis la session (Server Component)
 */
export async function getServerUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !supabaseUser) {
      return null;
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
      console.error('Error getting server user', error);
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

