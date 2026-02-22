'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  MessageCircle,
  Mail,
  Building,
  Zap,
  Workflow,
  Check,
  X,
  Plug,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { endpoints } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logger } from '@/lib/logger';

interface ShopifyStatus {
  connected: boolean;
  shopDomain?: string;
  shopName?: string;
  status?: string;
  lastSyncAt?: string | null;
}

const INTEGRATIONS = [
  {
    id: 'shopify',
    name: 'Shopify',
    icon: ShoppingBag,
    description: 'Synchronisez vos produits et commandes. Vos agents peuvent vérifier le statut des commandes.',
    status: 'active' as const,
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: MessageCircle,
    description: 'Recevez les escalations et notifications directement dans Slack.',
    status: 'coming' as const,
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: Mail,
    description: 'Synchronisez vos emails pour créer des conversations automatiquement.',
    status: 'coming' as const,
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: Building,
    description: 'Synchronisez vos contacts et deals CRM.',
    status: 'coming' as const,
  },
  {
    id: 'zapier',
    name: 'Zapier',
    icon: Zap,
    description: 'Connectez Luneo à 5000+ applications via Zapier.',
    status: 'coming' as const,
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    icon: Workflow,
    description: 'Automatisez des workflows complexes avec Make.',
    status: 'coming' as const,
  },
] as const;

export default function IntegrationsPage() {
  useAuth(); // Ensure auth context
  const { toast } = useToast();
  const [shopifyStatus, setShopifyStatus] = useState<ShopifyStatus | null>(null);
  const [shopifyLoading, setShopifyLoading] = useState(true);
  const [shopifyDialogOpen, setShopifyDialogOpen] = useState(false);
  const [shopifyConnectLoading, setShopifyConnectLoading] = useState(false);
  const [shopifyDisconnectLoading, setShopifyDisconnectLoading] = useState(false);
  const [shopDomain, setShopDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const fetchShopifyStatus = useCallback(async () => {
    try {
      setShopifyLoading(true);
      const data = await endpoints.integrations.shopifyV2.status();
      setShopifyStatus(data);
    } catch (err) {
      logger.error('Failed to fetch Shopify status', err);
      setShopifyStatus({ connected: false });
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer le statut Shopify.',
        variant: 'destructive',
      });
    } finally {
      setShopifyLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchShopifyStatus();
  }, [fetchShopifyStatus]);

  const handleShopifyConnect = async () => {
    if (!shopDomain.trim() || !accessToken.trim()) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez renseigner le domaine et le token.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setShopifyConnectLoading(true);
      await endpoints.integrations.shopifyV2.connect({
        shopDomain: shopDomain.trim(),
        accessToken: accessToken.trim(),
      });
      toast({
        title: 'Connecté',
        description: 'Shopify a été connecté avec succès.',
      });
      setShopifyDialogOpen(false);
      setShopDomain('');
      setAccessToken('');
      await fetchShopifyStatus();
    } catch (err) {
      logger.error('Shopify connect failed', err);
      const message = err instanceof Error ? err.message : 'Erreur lors de la connexion.';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setShopifyConnectLoading(false);
    }
  };

  const handleShopifyDisconnect = async () => {
    try {
      setShopifyDisconnectLoading(true);
      await endpoints.integrations.shopifyV2.disconnect();
      toast({
        title: 'Déconnecté',
        description: 'Shopify a été déconnecté.',
      });
      await fetchShopifyStatus();
    } catch (err) {
      logger.error('Shopify disconnect failed', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de déconnecter Shopify.',
        variant: 'destructive',
      });
    } finally {
      setShopifyDisconnectLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <Plug className="w-8 h-8 text-purple-400" />
            Intégrations
          </h1>
          <p className="text-white/60 mt-1">
            Connectez Luneo à vos outils préférés pour automatiser vos workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INTEGRATIONS.map((integration) => {
            const Icon = integration.icon;
            const isShopify = integration.id === 'shopify';

            return (
              <Card
                key={integration.id}
                className="bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] transition-colors"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/[0.06]">
                      <Icon className="w-5 h-5 text-white/80" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">{integration.name}</CardTitle>
                      {isShopify && shopifyLoading ? (
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-white/50">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Vérification...
                        </div>
                      ) : isShopify && shopifyStatus?.connected ? (
                        <Badge
                          variant="default"
                          className="mt-1.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Connecté
                        </Badge>
                      ) : integration.status === 'coming' ? (
                        <Badge
                          variant="secondary"
                          className="mt-1.5 bg-amber-500/20 text-amber-400 border-amber-500/30"
                        >
                          Bientôt disponible
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-white/60">
                    {integration.description}
                  </CardDescription>
                  {isShopify && shopifyStatus?.connected && shopifyStatus.shopDomain && (
                    <p className="mt-3 text-sm text-white/50">
                      Boutique : {shopifyStatus.shopDomain}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2">
                  {isShopify && !shopifyLoading && (
                    <>
                      {shopifyStatus?.connected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          onClick={handleShopifyDisconnect}
                          disabled={shopifyDisconnectLoading}
                        >
                          {shopifyDisconnectLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-1" />
                              Déconnecter
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
                          onClick={() => setShopifyDialogOpen(true)}
                        >
                          <Plug className="w-4 h-4 mr-1" />
                          Connecter
                        </Button>
                      )}
                    </>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={shopifyDialogOpen} onOpenChange={setShopifyDialogOpen}>
        <DialogContent className="bg-gray-900 border-white/[0.06] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Connecter Shopify</DialogTitle>
            <DialogDescription className="text-white/60">
              Entrez les identifiants de votre boutique Shopify pour synchroniser vos produits et commandes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shop-domain" className="text-white/80">
                Domaine de la boutique
              </Label>
              <Input
                id="shop-domain"
                placeholder="votre-boutique.myshopify.com"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                className="bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access-token" className="text-white/80">
                Admin API Access Token
              </Label>
              <Input
                id="access-token"
                type="password"
                placeholder="shpat_xxxxxxxxxxxx"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/40"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/[0.12] text-white/80 hover:bg-white/[0.04]"
              onClick={() => setShopifyDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
              onClick={handleShopifyConnect}
              disabled={shopifyConnectLoading}
            >
              {shopifyConnectLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Connecter'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
