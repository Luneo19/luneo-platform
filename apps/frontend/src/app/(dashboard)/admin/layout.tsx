/**
 * Layout admin pour les pages dashboard admin (tenants, credit-packs, discounts, health)
 * Vérifie que l'utilisateur a le rôle PLATFORM_ADMIN côté serveur.
 * Si getServerUser échoue (backend lent, cold start, etc.), on laisse le
 * client-side DashboardLayoutGroup + useAuth() gérer la redirection.
 * Cela évite la race condition où un redirect SSR streaming avorte
 * les fetches client-side en cours.
 */

import { requireAdminAccess } from '@/lib/admin/permissions';
import { ReactNode } from 'react';

export default async function DashboardAdminLayout({ children }: { children: ReactNode }) {
  await requireAdminAccess();

  return <>{children}</>;
}
