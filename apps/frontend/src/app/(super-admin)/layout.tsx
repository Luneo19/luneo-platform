/**
 * ★★★ SUPER ADMIN LAYOUT ★★★
 * Layout principal pour le Super Admin Dashboard
 * Protection automatique avec vérification du rôle PLATFORM_ADMIN
 *
 * IMPORTANT: requireAdminAccess() can return null when getServerUser()
 * fails due to backend latency/cold-start. In that case, we render the
 * shell anyway and let the client-side AuthProvider + AdminGuard handle
 * the redirect. This avoids a streaming-SSR race condition where a
 * server-side redirect() aborts in-flight client-side fetches.
 */

import { requireAdminAccess } from '@/lib/admin/permissions';
import { AdminSidebar } from '@/components/admin/layout/admin-sidebar';
import { AdminHeader } from '@/components/admin/layout/admin-header';
import { AdminGuard } from '@/components/admin/layout/admin-guard';
import { AdminLayoutShell } from '@/components/admin/layout/admin-layout-shell';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Super Admin Dashboard | Luneo Platform',
  description: 'Dashboard administrateur pour la gestion complète de la plateforme Luneo',
};

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminUser = await requireAdminAccess();

  return (
    <AdminGuard serverUser={adminUser}>
      <AdminLayoutShell
        sidebar={<AdminSidebar />}
        header={<AdminHeader user={adminUser} />}
      >
        {children}
      </AdminLayoutShell>
    </AdminGuard>
  );
}
