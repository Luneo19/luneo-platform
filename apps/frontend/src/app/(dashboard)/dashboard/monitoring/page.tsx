/**
 * Monitoring Dashboard Page
 * Server Component - Fetches monitoring data and renders dashboard
 * 
 * CURSOR RULES COMPLIANT:
 * - Server Component (no 'use client')
 * - Data fetching in Server Component
 * - Components < 300 lines
 * - Types explicit (no any)
 */

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { createClient } from '@/lib/supabase/server';
import { MonitoringDashboardClient } from './components/MonitoringDashboardClient';
import type { DashboardMetrics, Alert, ServiceHealth } from '@/lib/monitoring/types';

interface MonitoringPageProps {
  searchParams?: {
    tab?: string;
  };
}

async function getMonitoringData(): Promise<{
  metrics: DashboardMetrics | null;
  alerts: Alert[];
  services: ServiceHealth[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        metrics: null,
        alerts: [],
        services: [],
        error: 'Non authentifié',
      };
    }

    // Fetch monitoring data from API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/monitoring/dashboard`, {
      headers: {
        Cookie: (await supabase.auth.getSession()).data.session?.access_token || '',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch monitoring data: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erreur lors du chargement des métriques');
    }

    return {
      metrics: data.data.metrics || null,
      alerts: data.data.alerts || [],
      services: data.data.services || [],
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      metrics: null,
      alerts: [],
      services: [],
      error: errorMessage,
    };
  }
}

export default async function MonitoringPage({ searchParams }: MonitoringPageProps) {
  const { metrics, alerts, services, error } = await getMonitoringData();
  const activeTab = searchParams?.tab || 'overview';

  return (
    <ErrorBoundary level="page" componentName="MonitoringPage">
      <MonitoringDashboardClient
        initialMetrics={metrics}
        initialAlerts={alerts}
        initialServices={services}
        initialError={error}
        initialTab={activeTab}
      />
    </ErrorBoundary>
  );
}
