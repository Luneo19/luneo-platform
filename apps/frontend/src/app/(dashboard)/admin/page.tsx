/**
 * ★★★ PAGE - ADMINISTRATION ★★★
 * Page complète pour l'administration
 * - Statistiques système
 * - Gestion utilisateurs
 * - Gestion marques
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { memo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { logger } from '@/lib/logger';
import { formatDate, formatPrice } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Building2, TrendingUp, DollarSign, Package, AlertCircle, CheckCircle, X, Plus } from 'lucide-react';

// ========================================
// COMPONENT
// ========================================

function AdminPageContent() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');

  // Queries
  const systemStatsQuery = trpc.admin.getSystemStats.useQuery();
  const usersQuery = trpc.admin.listUsers.useQuery({ limit: 50 });
  const brandsQuery = trpc.admin.listBrands.useQuery({ limit: 50 });

  // Mutations
  const suspendUserMutation = trpc.admin.suspendUser.useMutation({
    onSuccess: () => {
      usersQuery.refetch();
    },
  });

  const activateUserMutation = trpc.admin.activateUser.useMutation({
    onSuccess: () => {
      usersQuery.refetch();
    },
  });

  const suspendBrandMutation = trpc.admin.suspendBrand.useMutation({
    onSuccess: () => {
      brandsQuery.refetch();
    },
  });

  // ========================================
  // FILTERED DATA
  // ========================================

  const filteredUsers = useMemo(() => {
    if (!usersQuery.data?.users) return [];

    let filtered = usersQuery.data.users;

    if (userSearch) {
      const searchLower = userSearch.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchLower) ||
          user.name?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [usersQuery.data?.users, userSearch]);

  const filteredBrands = useMemo(() => {
    if (!brandsQuery.data?.brands) return [];

    let filtered = brandsQuery.data.brands;

    if (brandSearch) {
      const searchLower = brandSearch.toLowerCase();
      filtered = filtered.filter(
        (brand) =>
          brand.name.toLowerCase().includes(searchLower) ||
          brand.slug.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [brandsQuery.data?.brands, brandSearch]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleSuspendUser = useCallback(
    (userId: string) => {
      if (!confirm('Êtes-vous sûr de vouloir suspendre cet utilisateur ?')) {
        return;
      }

      suspendUserMutation.mutate({ id: userId });
    },
    [suspendUserMutation]
  );

  const handleActivateUser = useCallback(
    (userId: string) => {
      activateUserMutation.mutate({ id: userId });
    },
    [activateUserMutation]
  );

  const handleSuspendBrand = useCallback(
    (brandId: string) => {
      if (!confirm('Êtes-vous sûr de vouloir suspendre cette marque ?')) {
        return;
      }

      suspendBrandMutation.mutate({ id: brandId });
    },
    [suspendBrandMutation]
  );

  // ========================================
  // RENDER
  // ========================================

  if (systemStatsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  const stats = systemStatsQuery.data;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Administration</h1>
        <p className="text-gray-600">Gestion du système</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="brands">Marques</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-gray-500">
                  {stats?.newUsersToday || 0} nouveaux aujourd'hui
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Marques</CardTitle>
                <Building2 className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalBrands || 0}</div>
                <p className="text-xs text-gray-500">
                  {stats?.newBrandsToday || 0} nouvelles aujourd'hui
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produits</CardTitle>
                <Package className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
                <p className="text-xs text-gray-500">Total produits</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenus</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPrice((stats?.totalRevenue || 0) / 100, 'EUR')}
                </div>
                <p className="text-xs text-gray-500">Total revenus</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Utilisateurs</CardTitle>
                  <CardDescription>
                    Gestion des utilisateurs ({usersQuery.data?.total || 0})
                  </CardDescription>
                </div>
                <Input
                  placeholder="Rechercher..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-[300px]"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">Aucun utilisateur trouvé</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Dernière connexion</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <X className="h-3 w-3 mr-1" />
                              Suspendu
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt
                            ? formatDate(user.lastLoginAt)
                            : 'Jamais'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {user.isActive ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleSuspendUser(user.id)}
                              >
                                Suspendre
                              </Button>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleActivateUser(user.id)}
                              >
                                Activer
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brands Tab */}
        <TabsContent value="brands">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Marques</CardTitle>
                  <CardDescription>
                    Gestion des marques ({brandsQuery.data?.total || 0})
                  </CardDescription>
                </div>
                <Input
                  placeholder="Rechercher..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="w-[300px]"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredBrands.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">Aucune marque trouvée</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Créée le</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBrands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell className="font-medium">{brand.name}</TableCell>
                        <TableCell>{brand.slug}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              brand.status === 'ACTIVE'
                                ? 'default'
                                : brand.status === 'SUSPENDED'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {brand.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{brand.plan}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(brand.createdAt)}</TableCell>
                        <TableCell>
                          {brand.status === 'ACTIVE' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleSuspendBrand(brand.id)}
                            >
                              Suspendre
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ========================================
// EXPORT
// ========================================

const AdminPage = memo(function AdminPage() {
  return (
    <ErrorBoundary>
      <AdminPageContent />
    </ErrorBoundary>
  );
});

export default AdminPage;

