'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { AdminUser } from '@/lib/admin/permissions';
import { ensureSession } from '@/lib/auth/session-client';

interface AdminGuardProps {
  serverUser: AdminUser | null;
  children: React.ReactNode;
}

/**
 * Client-side fallback for admin authentication.
 *
 * When the server-side requireAdminAccess() returns null (backend was
 * unreachable during SSR), this component waits for the AuthProvider's
 * loadUser() to resolve and redirects accordingly.
 *
 * When serverUser is already set (happy path), it renders immediately.
 */
export function AdminGuard({ serverUser, children }: AdminGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const recoveringRef = useRef(false);

  useEffect(() => {
    if (serverUser) return;
    if (isLoading) return;
    if (recoveringRef.current) return;

    if (!user) {
      recoveringRef.current = true;
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/admin';

      (async () => {
        try {
          if (await ensureSession()) {
            recoveringRef.current = false;
            router.refresh();
            return;
          }
        } catch {
          // Fall through to login redirect.
        }

        recoveringRef.current = false;
        router.replace('/login?redirect=' + encodeURIComponent(currentPath));
      })();
      return;
    }

    if (user.role !== 'PLATFORM_ADMIN' && user.role !== 'ADMIN') {
      router.replace('/overview');
    }
  }, [serverUser, user, isLoading, router]);

  if (serverUser) {
    return <>{children}</>;
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
          </div>
          <p className="text-white/40 text-sm font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'PLATFORM_ADMIN' && user.role !== 'ADMIN') {
    return null;
  }

  return <>{children}</>;
}
