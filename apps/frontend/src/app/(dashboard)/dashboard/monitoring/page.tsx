/**
 * Monitoring Dashboard Page
 * Server Component - Cookie-based auth, fetches monitoring data via BFF with Bearer token.
 */

import { cookies } from 'next/headers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MonitoringDashboardClient } from './components/MonitoringDashboardClient';
import type { DashboardMetrics, Alert, ServiceHealth } from '@/lib/monitoring/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return {
        metrics: null,
        alerts: [],
        services: [],
        error: 'Non authentifié',
      };
    }

    const userRes = await fetch(`${API_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!userRes.ok) {
      return {
        metrics: null,
        alerts: [],
        services: [],
        error: 'Non authentifié',
      };
    }

    // Fetch monitoring data from BFF (forward cookie so BFF can use same token if needed)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/monitoring/dashboard`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Cookie: `accessToken=${accessToken}`,
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
