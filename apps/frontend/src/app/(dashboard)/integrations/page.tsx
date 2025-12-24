/**
 * ★★★ PAGE - INTÉGRATIONS E-COMMERCE ★★★
 * Page complète pour gérer les intégrations
 * - Liste intégrations
 * - Setup Shopify
 * - Setup WooCommerce
 * - Sync
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { memo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { logger } from '@/lib/logger';
import { formatDate, formatRelativeDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Store, RefreshCw, Trash2, Plus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// ========================================
// COMPONENT
// ========================================

function IntegrationsPageContent() {
  const [showShopifyDialog, setShowShopifyDialog] = useState(false);
  const [showWooCommerceDialog, setShowWooCommerceDialog] = useState(false);
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [shopifyToken, setShopifyToken] = useState('');
  const [wooDomain, setWooDomain] = useState('');
  const [wooKey, setWooKey] = useState('');
  const [wooSecret, setWooSecret] = useState('');

  // Queries
  const integrationsQuery = trpc.integration.list.useQuery();

  // Mutations
  const createShopifyMutation = trpc.integration.createShopify.useMutation({
    onSuccess: () => {
      integrationsQuery.refetch();
      setShowShopifyDialog(false);
      setShopifyDomain('');
      setShopifyToken('');
    },
  });

  const createWooCommerceMutation = trpc.integration.createWooCommerce.useMutation({
    onSuccess: () => {
      integrationsQuery.refetch();
      setShowWooCommerceDialog(false);
      setWooDomain('');
      setWooKey('');
      setWooSecret('');
    },
  });

  const syncMutation = trpc.integration.sync.useMutation({
    onSuccess: () => {
      integrationsQuery.refetch();
      logger.info('Sync completed');
    },
  });

  const deleteMutation = trpc.integration.delete.useMutation({
    onSuccess: () => {
      integrationsQuery.refetch();
    },
  });

  // ========================================
  // HANDLERS
  // ========================================

  const handleCreateShopify = useCallback(() => {
    if (!shopifyDomain || !shopifyToken) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    createShopifyMutation.mutate({
      shopDomain: shopifyDomain,
      accessToken: shopifyToken,
    });
  }, [shopifyDomain, shopifyToken, createShopifyMutation]);

  const handleCreateWooCommerce = useCallback(() => {
    if (!wooDomain || !wooKey || !wooSecret) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    createWooCommerceMutation.mutate({
      shopDomain: wooDomain,
      consumerKey: wooKey,
      consumerSecret: wooSecret,
    });
  }, [wooDomain, wooKey, wooSecret, createWooCommerceMutation]);

  const handleSync = useCallback(
    (integrationId: string) => {
      syncMutation.mutate({
        integrationId,
        options: {
          products: true,
          orders: true,
          direction: 'both',
        },
      });
    },
    [syncMutation]
  );

  const handleDelete = useCallback(
    (integrationId: string) => {
      if (!confirm('Êtes-vous sûr de vouloir supprimer cette intégration ?')) {
        return;
      }

      deleteMutation.mutate({ id: integrationId });
    },
    [deleteMutation]
  );

  // ========================================
  // RENDER
  // ========================================

  const integrations = integrationsQuery.data || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-white">Intégrations E-commerce</h1>
        <p className="text-gray-400">
          Connectez votre boutique en ligne à Luneo
        </p>
      </div>

      {/* Integrations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Shopify Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Shopify
            </CardTitle>
            <CardDescription>
              Connectez votre boutique Shopify
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showShopifyDialog} onOpenChange={setShowShopifyDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Connecter Shopify
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connecter Shopify</DialogTitle>
                  <DialogDescription>
                    Entrez les informations de votre boutique Shopify
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Domaine de la boutique</Label>
                    <Input
                      placeholder="votre-boutique.myshopify.com"
                      value={shopifyDomain}
                      onChange={(e) => setShopifyDomain(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Access Token</Label>
                    <Input
                      type="password"
                      placeholder="shpat_..."
                      value={shopifyToken}
                      onChange={(e) => setShopifyToken(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleCreateShopify}
                    disabled={createShopifyMutation.isLoading}
                    className="w-full"
                  >
                    {createShopifyMutation.isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      'Connecter'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* WooCommerce Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              WooCommerce
            </CardTitle>
            <CardDescription>
              Connectez votre boutique WooCommerce
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showWooCommerceDialog} onOpenChange={setShowWooCommerceDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Connecter WooCommerce
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connecter WooCommerce</DialogTitle>
                  <DialogDescription>
                    Entrez les informations de votre boutique WooCommerce
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>URL de la boutique</Label>
                    <Input
                      placeholder="https://votre-boutique.com"
                      value={wooDomain}
                      onChange={(e) => setWooDomain(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Consumer Key</Label>
                    <Input
                      type="password"
                      placeholder="ck_..."
                      value={wooKey}
                      onChange={(e) => setWooKey(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Consumer Secret</Label>
                    <Input
                      type="password"
                      placeholder="cs_..."
                      value={wooSecret}
                      onChange={(e) => setWooSecret(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleCreateWooCommerce}
                    disabled={createWooCommerceMutation.isLoading}
                    className="w-full"
                  >
                    {createWooCommerceMutation.isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      'Connecter'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Active Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Intégrations actives</CardTitle>
          <CardDescription>
            {integrations.length} intégration{integrations.length > 1 ? 's' : ''} connectée{integrations.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <div className="text-center py-12">
              <Store className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-400">Aucune intégration connectée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {integrations.map((integration) => (
                <Card key={integration.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{integration.platform.toUpperCase()}</h4>
                          <Badge
                            variant={
                              integration.status === 'active'
                                ? 'default'
                                : integration.status === 'error'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {integration.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{integration.shopDomain}</p>
                        {integration.lastSyncAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Dernière sync: {formatRelativeDate(integration.lastSyncAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(integration.id)}
                          disabled={syncMutation.isLoading}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(integration.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ========================================
// EXPORT
// ========================================

const IntegrationsPage = memo(function IntegrationsPage() {
  return (
    <ErrorBoundary>
      <IntegrationsPageContent />
    </ErrorBoundary>
  );
});

export default IntegrationsPage;

