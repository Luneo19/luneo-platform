'use client';

/**
 * Client Component pour le Dashboard Principal
 * Gère les interactions et les mises à jour en temps réel
 */

import { useState } from 'react';
import { DashboardKPIs } from './DashboardKPIs';
import { DashboardCharts } from './DashboardCharts';
import { RecentNotifications } from './RecentNotifications';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';

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
  initialNotifications,
}: DashboardPageClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Vue d'ensemble de votre activité
          </p>
        </div>
      </div>

      {/* KPIs */}
      <DashboardKPIs
        period={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />

      {/* Charts and Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts - Takes 2 columns */}
        <div className="lg:col-span-2">
          <DashboardCharts period={selectedPeriod} />
        </div>

        {/* Sidebar - Takes 1 column */}
        <div className="space-y-6">
          <QuickActions />
          <RecentNotifications notifications={initialNotifications} />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity period={selectedPeriod} />
    </div>
  );
}

