'use client';

/**
 * Client Component pour le Dashboard Principal
 * Délègue tout le contenu adaptatif au DashboardShell (KPIs, widgets, personnalisation).
 */

import { DashboardShell } from './DashboardShell';

interface DashboardPageClientProps {
  initialNotifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
  }>;
}

export function DashboardPageClient({
  initialNotifications: _initialNotifications,
}: DashboardPageClientProps) {
  return <DashboardShell />;
}

