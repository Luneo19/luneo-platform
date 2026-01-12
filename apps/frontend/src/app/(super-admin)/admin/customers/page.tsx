/**
 * ★★★ ADMIN CUSTOMERS PAGE ★★★
 * Page liste des customers avec filtres et quick stats
 */

'use client';

import React from 'react';
import { CustomersTable } from '@/components/admin/customers/customers-table';
import { useCustomers } from '@/hooks/admin/use-customers';
import { KPICard } from '@/components/admin/widgets/kpi-card';
import { Users, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

export default function CustomersPage() {
  const {
    customers,
    pagination,
    isLoading,
    filters,
    updateFilters,
    goToPage,
  } = useCustomers();

  // Calculer les stats depuis les customers
  const stats = React.useMemo(() => {
    const active = customers.filter(c => c.status === 'active').length;
    const trial = customers.filter(c => c.status === 'trial').length;
    const atRisk = customers.filter(c => c.churnRisk === 'high').length;
    const totalLTV = customers.reduce((sum, c) => sum + c.ltv, 0);
    const avgLTV = customers.length > 0 ? totalLTV / customers.length : 0;

    return { active, trial, atRisk, avgLTV };
  }, [customers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Customers</h1>
        <p className="text-zinc-400 mt-2">
          Manage and analyze your customer base
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Customers"
          value={pagination.total}
          icon={Users}
          isLoading={isLoading}
        />
        <KPICard
          title="Active"
          value={stats.active}
          change={stats.active}
          trend="up"
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <KPICard
          title="At Risk"
          value={stats.atRisk}
          trend={stats.atRisk > 0 ? 'down' : 'neutral'}
          icon={AlertTriangle}
          isLoading={isLoading}
        />
        <KPICard
          title="Avg LTV"
          value={stats.avgLTV}
          icon={DollarSign}
          isLoading={isLoading}
        />
      </div>

      {/* Customers Table */}
      <CustomersTable
        customers={customers}
        pagination={pagination}
        isLoading={isLoading}
        filters={filters}
        onFiltersChange={updateFilters}
        onPageChange={goToPage}
      />
    </div>
  );
}
