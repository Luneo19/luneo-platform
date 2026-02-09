'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface TenantUsage {
  brandId: string;
  plan: string;
  usage: Record<string, { current: number; limit: number; percentage: number }>;
  totalCostCents: number;
  featuresDisabled: string[];
  softLimitReached: boolean;
  recommendations: string[];
}

interface Tenant {
  id: string;
  name: string;
  plan: string;
  status: string;
  usage?: TenantUsage;
}

function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const data = await api.get<Tenant[] | { tenants?: Tenant[] }>('/api/v1/admin/tenants');
      const list = Array.isArray(data) ? data : (data as { tenants?: Tenant[] })?.tenants ?? [];
      setTenants(list);
    } catch (error) {
      logger.error('Failed to fetch tenants', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantUsage = async (brandId: string) => {
    try {
      const usage = await api.get<TenantUsage>('/api/v1/usage-billing/tenant/' + brandId + '/usage', {
        params: { enforceSoftLimit: 'true' },
      });
      setTenants((prev) =>
        prev.map((t) => (t.id === brandId ? { ...t, usage } : t))
      );
    } catch (error) {
      logger.error('Failed to fetch tenant usage', {
        error,
        brandId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const toggleFeature = async (brandId: string, feature: string, enabled: boolean) => {
    try {
      await api.patch(`/api/v1/admin/tenants/${brandId}/features`, { feature, enabled });
      await fetchTenantUsage(brandId);
    } catch (error) {
      logger.error('Failed to toggle feature', {
        error,
        brandId,
        feature,
        enabled,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Optimisé: useMemo pour filteredTenants
  const filteredTenants = useMemo(() => tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.id.toLowerCase().includes(searchQuery.toLowerCase())
  ), [tenants, searchQuery]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  if (loading) {
    return <div className="p-6 text-white/60">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tenant Management</h1>
          <p className="text-white/60 mt-1">
            View tenant costs and manage feature access
          </p>
        </div>
      </div>

      <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Search Tenants</CardTitle>
          <CardDescription className="text-white/60">Find tenants by name or ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-4 w-4" />
            <Input
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 dash-input border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/40"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Tenants Overview</CardTitle>
          <CardDescription className="text-white/60">
            {filteredTenants.length} tenant{filteredTenants.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-white/[0.02]">
                <TableHead className="text-white/60 border-white/[0.06]">Tenant</TableHead>
                <TableHead className="text-white/60 border-white/[0.06]">Plan</TableHead>
                <TableHead className="text-white/60 border-white/[0.06]">Status</TableHead>
                <TableHead className="text-white/60 border-white/[0.06]">Monthly Cost</TableHead>
                <TableHead className="text-white/60 border-white/[0.06]">Usage</TableHead>
                <TableHead className="text-white/60 border-white/[0.06]">Features</TableHead>
                <TableHead className="text-white/60 border-white/[0.06]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow key={tenant.id} className="border-white/[0.06] hover:bg-white/[0.04]">
                  <TableCell className="font-medium text-white border-white/[0.06]">{tenant.name}</TableCell>
                  <TableCell className="border-white/[0.06]">
                    <span className={`dash-badge ${tenant.plan === 'enterprise' ? 'dash-badge-enterprise' : 'dash-badge-pro'}`}>
                      {tenant.plan}
                    </span>
                  </TableCell>
                  <TableCell className="border-white/[0.06]">
                    {tenant.status === 'active' ? (
                      <span className="dash-badge dash-badge-new">
                        <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                        Active
                      </span>
                    ) : (
                      <span className="dash-badge dash-badge-live">
                        <XCircle className="h-3 w-3 mr-1 inline" />
                        {tenant.status}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="border-white/[0.06]">
                    {tenant.usage ? (
                      <span className="font-semibold text-white">
                        {formatCurrency(tenant.usage.totalCostCents)}
                      </span>
                    ) : (
                      <span className="text-white/40">-</span>
                    )}
                  </TableCell>
                  <TableCell className="border-white/[0.06]">
                    {tenant.usage ? (
                      <div className="space-y-1">
                        {Object.entries(tenant.usage.usage).slice(0, 2).map(([metric, data]) => (
                          <div key={metric} className="text-xs text-white/60">
                            <span className="capitalize">{metric.replace('_', ' ')}:</span>{' '}
                            <span className={data.percentage >= 95 ? 'text-[#f87171] font-semibold' : 'text-white/80'}>
                              {data.current}/{data.limit} ({data.percentage.toFixed(0)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/80 hover:bg-white/[0.04] hover:text-white"
                        onClick={() => fetchTenantUsage(tenant.id)}
                      >
                        Load Usage
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="border-white/[0.06]">
                    {tenant.usage?.featuresDisabled.length ? (
                      <span className="dash-badge dash-badge-live">
                        {tenant.usage.featuresDisabled.length} disabled
                      </span>
                    ) : (
                      <span className="dash-badge dash-badge-new">All enabled</span>
                    )}
                  </TableCell>
                  <TableCell className="border-white/[0.06]">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/[0.08] text-white hover:bg-white/[0.04] hover:text-white"
                      onClick={() => setSelectedTenant(tenant.id === selectedTenant ? null : tenant.id)}
                    >
                      {selectedTenant === tenant.id ? 'Hide' : 'View'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedTenant && (
        <TenantDetailCard
          tenant={tenants.find((t) => t.id === selectedTenant)!}
          onToggleFeature={toggleFeature}
          onRefresh={() => fetchTenantUsage(selectedTenant)}
        />
      )}
    </div>
  );
}

function TenantDetailCard({
  tenant,
  onToggleFeature,
  onRefresh,
}: {
  tenant: Tenant;
  onToggleFeature: (brandId: string, feature: string, enabled: boolean) => void;
  onRefresh: () => void;
}) {
  const usage = tenant.usage;

  if (!usage) {
    return (
      <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Tenant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/60">No usage data available. Click "Load Usage" first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">{tenant.name} - Details</CardTitle>
        <CardDescription className="text-white/60">Usage, costs, and feature management</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {usage.softLimitReached && (
          <Alert className="border-[#f87171]/30 bg-[#f87171]/10 text-[#f87171]">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Soft limit reached. Some features may be disabled.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/80">Monthly Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(usage.totalCostCents / 100)}
              </div>
            </CardContent>
          </Card>

          <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/80">Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <span className={`dash-badge text-base ${usage.plan === 'enterprise' ? 'dash-badge-enterprise' : 'dash-badge-pro'}`}>
                {usage.plan}
              </span>
            </CardContent>
          </Card>

          <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/80">Features Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usage.featuresDisabled.length === 0 ? (
                  <span className="text-[#4ade80]">All Enabled</span>
                ) : (
                  <span className="text-[#f87171]">{usage.featuresDisabled.length} Disabled</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Usage Metrics</h3>
          <div className="space-y-3">
            {Object.entries(usage.usage).map(([metric, data]) => (
              <div key={metric} className="flex items-center justify-between p-3 border border-white/[0.06] rounded-xl bg-white/[0.02]">
                <div className="flex-1">
                  <div className="font-medium capitalize text-white">
                    {metric.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-white/60">
                    {data.current} / {data.limit} ({data.percentage.toFixed(1)}%)
                  </div>
                </div>
                <div className="w-32">
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        data.percentage >= 95
                          ? 'bg-[#f87171]'
                          : data.percentage >= 75
                          ? 'bg-[#fbbf24]'
                          : 'bg-[#4ade80]'
                      }`}
                      style={{ width: `${Math.min(data.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Feature Management</h3>
          <div className="space-y-2">
            {['render', 'ai_generation', 'storage_upload'].map((feature) => {
              const isDisabled = usage.featuresDisabled.includes(feature);
              return (
                <div
                  key={feature}
                  className="flex items-center justify-between p-3 border border-white/[0.06] rounded-xl bg-white/[0.02]"
                >
                  <div>
                    <div className="font-medium capitalize text-white">{feature.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-white/60">
                      {isDisabled ? 'Currently disabled' : 'Currently enabled'}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className={isDisabled
                      ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white hover:opacity-90'
                      : 'bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/30 hover:bg-[#f87171]/30'}
                    onClick={() => onToggleFeature(tenant.id, feature, !isDisabled)}
                  >
                    {isDisabled ? 'Enable' : 'Disable'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {usage.recommendations.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Recommendations</h3>
            <ul className="space-y-2">
              {usage.recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm text-white/60 flex items-start">
                  <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-[#fbbf24] shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          onClick={onRefresh}
          variant="outline"
          className="border-white/[0.08] text-white hover:bg-white/[0.04]"
        >
          Refresh Data
        </Button>
      </CardContent>
    </Card>
  );
}

const MemoizedAdminTenantsPage = memo(AdminTenantsPage);

export default function AdminTenantsPageWrapper() {
  return (
    <ErrorBoundary level="page" componentName="AdminTenantsPage">
      <MemoizedAdminTenantsPage />
    </ErrorBoundary>
  );
}

