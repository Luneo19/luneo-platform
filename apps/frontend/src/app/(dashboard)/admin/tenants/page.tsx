'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

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

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      // In a real implementation, this would fetch from /api/admin/tenants
      // For now, we'll use a mock or call the usage endpoint
      const response = await fetch('/api/admin/tenants');
      if (response.ok) {
        const data = await response.json();
        setTenants(data);
      }
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
      const response = await fetch(`/api/usage-billing/tenant/${brandId}/usage?enforceSoftLimit=true`);
      if (response.ok) {
        const usage = await response.json();
        setTenants((prev) =>
          prev.map((t) => (t.id === brandId ? { ...t, usage } : t))
        );
      }
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
      const response = await fetch(`/api/admin/tenants/${brandId}/features`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, enabled }),
      });
      if (response.ok) {
        await fetchTenantUsage(brandId);
      }
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

  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tenant Management</h1>
          <p className="text-muted-foreground mt-1">
            View tenant costs and manage feature access
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Tenants</CardTitle>
          <CardDescription>Find tenants by name or ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tenants Overview</CardTitle>
          <CardDescription>
            {filteredTenants.length} tenant{filteredTenants.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Monthly Cost</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tenant.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    {tenant.status === 'active' ? (
                      <Badge variant="default">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        {tenant.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {tenant.usage ? (
                      <span className="font-semibold">
                        {formatCurrency(tenant.usage.totalCostCents)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {tenant.usage ? (
                      <div className="space-y-1">
                        {Object.entries(tenant.usage.usage).slice(0, 2).map(([metric, data]) => (
                          <div key={metric} className="text-xs">
                            <span className="capitalize">{metric.replace('_', ' ')}:</span>{' '}
                            <span className={data.percentage >= 95 ? 'text-red-500 font-semibold' : ''}>
                              {data.current}/{data.limit} ({data.percentage.toFixed(0)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchTenantUsage(tenant.id)}
                      >
                        Load Usage
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {tenant.usage?.featuresDisabled.length ? (
                      <Badge variant="destructive">
                        {tenant.usage.featuresDisabled.length} disabled
                      </Badge>
                    ) : (
                      <Badge variant="outline">All enabled</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
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
      <Card>
        <CardHeader>
          <CardTitle>Tenant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No usage data available. Click "Load Usage" first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tenant.name} - Details</CardTitle>
        <CardDescription>Usage, costs, and feature management</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {usage.softLimitReached && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Soft limit reached. Some features may be disabled.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(usage.totalCostCents / 100)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-lg">
                {usage.plan}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Features Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usage.featuresDisabled.length === 0 ? (
                  <span className="text-green-600">All Enabled</span>
                ) : (
                  <span className="text-red-600">{usage.featuresDisabled.length} Disabled</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Usage Metrics</h3>
          <div className="space-y-3">
            {Object.entries(usage.usage).map(([metric, data]) => (
              <div key={metric} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium capitalize">
                    {metric.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {data.current} / {data.limit} ({data.percentage.toFixed(1)}%)
                  </div>
                </div>
                <div className="w-32">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        data.percentage >= 95
                          ? 'bg-red-500'
                          : data.percentage >= 75
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
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
          <h3 className="text-lg font-semibold mb-4">Feature Management</h3>
          <div className="space-y-2">
            {['render', 'ai_generation', 'storage_upload'].map((feature) => {
              const isDisabled = usage.featuresDisabled.includes(feature);
              return (
                <div
                  key={feature}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium capitalize">{feature.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-muted-foreground">
                      {isDisabled ? 'Currently disabled' : 'Currently enabled'}
                    </div>
                  </div>
                  <Button
                    variant={isDisabled ? 'default' : 'destructive'}
                    size="sm"
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
            <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
            <ul className="space-y-2">
              {usage.recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                  <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-yellow-500" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button onClick={onRefresh} variant="outline">
          Refresh Data
        </Button>
      </CardContent>
    </Card>
  );
}
