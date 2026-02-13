/**
 * Layout admin pour les pages dashboard admin (tenants, credit-packs, discounts, health)
 * Vérifie que l'utilisateur a le rôle PLATFORM_ADMIN
 */

import { requireAdminAccess } from '@/lib/admin/permissions';
import { ReactNode } from 'react';

export default async function DashboardAdminLayout({ children }: { children: ReactNode }) {
  // Server-side check: redirect to dashboard if not admin
  await requireAdminAccess();

  return <>{children}</>;
}
