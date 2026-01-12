/**
 * ★★★ SUPER ADMIN LAYOUT ★★★
 * Layout principal pour le Super Admin Dashboard
 * Protection automatique avec vérification du rôle PLATFORM_ADMIN
 */

import { requireAdminAccess } from '@/lib/admin/permissions';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/layout/admin-sidebar';
import { AdminHeader } from '@/components/admin/layout/admin-header';

export const metadata = {
  title: 'Super Admin Dashboard | Luneo Platform',
  description: 'Dashboard administrateur pour la gestion complète de la plateforme Luneo',
};

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Vérifie que l'utilisateur est super admin
  // Redirige automatiquement si non autorisé
  const adminUser = await requireAdminAccess();

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={adminUser} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-900">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
