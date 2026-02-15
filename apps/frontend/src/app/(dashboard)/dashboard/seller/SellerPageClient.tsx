/**
 * Client Component pour Seller Dashboard
 * Version professionnelle améliorée
 */

'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { PlanGate } from '@/lib/hooks/api/useFeatureGate';
import { UpgradePrompt } from '@/components/upgrade/UpgradePrompt';
import { SellerHeader } from './components/SellerHeader';
import { SellerStats } from './components/SellerStats';
import { useSellerData } from './hooks/useSellerData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, Star, Wallet, BarChart3, Settings } from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils/formatters';

// Helper to format price (assuming prices are in cents)
function formatPriceFromCents(value: number): string {
  return formatPrice(value / 100, 'EUR');
}

export function SellerPageClient() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'orders' | 'reviews' | 'payouts' | 'analytics' | 'settings'
  >('overview');
  const [isConnecting, setIsConnecting] = useState(false);

  const { sellerStatus, stats, products, orders, reviews, payouts, isLoading, refetch } =
    useSellerData();

  const handleAddProduct = () => {
    toast({
      title: 'Ajouter un produit',
      description: 'Configurez votre nouveau produit dans l\'interface du marketplace.',
    });
    // Navigate to product creation
    window.location.href = '/dashboard/seller/products/new';
  };

  const handleEditProduct = (productId: string) => {
    window.location.href = `/dashboard/seller/products/${productId}/edit`;
  };

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    try {
      const data = await api.post<{ data?: { onboardingUrl?: string }; onboardingUrl?: string }>(
        '/api/v1/marketplace/seller/connect',
        {}
      );
      const url = data?.data?.onboardingUrl ?? data?.onboardingUrl;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No onboarding URL received');
      }
    } catch (error: unknown) {
      logger.error('Failed to connect Stripe', { error });
      toast({
        title: t('common.error'),
        description: t('common.somethingWentWrong'),
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="dash-card h-16 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="dash-card h-24 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <PlanGate
      minimumPlan="business"
      showUpgradePrompt
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <UpgradePrompt
            requiredPlan="business"
            feature="Marketplace Seller"
            description="Le dashboard vendeur Marketplace est disponible à partir du plan Business."
          />
        </div>
      }
    >
    <div className="space-y-6 pb-10">
      <SellerHeader
        sellerStatus={sellerStatus}
        onConnectStripe={handleConnectStripe}
        isConnecting={isConnecting}
      />
      <SellerStats stats={stats} />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="dash-card border-white/[0.06] bg-white/[0.04] p-1">
          <TabsTrigger value="overview" className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04]">
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04]">
            <Package className="w-4 h-4 mr-2" />
            Produits
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04]">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Commandes
          </TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04]">
            <Star className="w-4 h-4 mr-2" />
            Avis
          </TabsTrigger>
          <TabsTrigger value="payouts" className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04]">
            <Wallet className="w-4 h-4 mr-2" />
            Paiements
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04]">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04]">
            <Settings className="w-4 h-4 mr-2" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Produits récents</CardTitle>
                <CardDescription className="text-white/60">Vos produits les plus vendus</CardDescription>
              </CardHeader>
              <CardContent>
                {products.length > 0 ? (
                  <div className="space-y-3">
                    {products.slice(0, 5).map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 bg-white/[0.04] rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/[0.06] rounded" />
                          <div>
                            <p className="text-white text-sm font-medium">{product.name}</p>
                            <p className="text-white/60 text-xs">
                              {product.sales} ventes • {formatPriceFromCents(product.revenue)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 text-center py-4">Aucun produit</p>
                )}
              </CardContent>
            </Card>

            <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Commandes récentes</CardTitle>
                <CardDescription className="text-white/60">Dernières commandes</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 bg-white/[0.04] rounded-lg"
                      >
                        <div>
                          <p className="text-white text-sm font-medium">#{order.orderNumber}</p>
                          <p className="text-white/60 text-xs">
                            {order.customerName} • {formatPriceFromCents(order.total)}
                          </p>
                        </div>
                        <span className="text-xs text-white/60">{formatDate(order.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 text-center py-4">Aucune commande</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4 mt-6">
          <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Mes produits</CardTitle>
                  <CardDescription className="text-white/60">{products.length} produits au total</CardDescription>
                </div>
                <Button onClick={handleAddProduct} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
                  <Package className="w-4 h-4 mr-2" />
                  Ajouter un produit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <div className="space-y-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 bg-white/[0.04] rounded-lg hover:bg-white/[0.06] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/[0.06] rounded" />
                        <div>
                          <p className="text-white font-medium">{product.name}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-white/60">
                            <span>{formatPriceFromCents(product.price)}</span>
                            <span>•</span>
                            <span>{product.sales} ventes</span>
                            <span>•</span>
                            <span>Stock: {product.stock}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-white/[0.06] hover:bg-white/[0.04]" onClick={() => handleEditProduct(product.id)}>
                        Modifier
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60 mb-4">Aucun produit pour le moment</p>
                  <Button onClick={handleAddProduct} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
                    <Package className="w-4 h-4 mr-2" />
                    Ajouter votre premier produit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4 mt-6">
          <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Commandes</CardTitle>
              <CardDescription className="text-white/60">{orders.length} commandes au total</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-white/[0.04] rounded-lg"
                    >
                      <div>
                        <p className="text-white font-medium">#{order.orderNumber}</p>
                        <p className="text-white/60 text-sm mt-1">
                          {order.customerName} • {order.productName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{formatPriceFromCents(order.total)}</p>
                        <p className="text-white/60 text-xs mt-1">
                          Commission: {formatPriceFromCents(order.commission)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60 text-center py-12">Aucune commande</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4 mt-6">
          <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Avis clients</CardTitle>
              <CardDescription className="text-white/60">
                {stats?.averageRating.toFixed(1)}/5 • {stats?.totalReviews} avis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-white/[0.04] rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white font-medium">{review.customerName}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {'★'.repeat(review.rating)}
                            {'☆'.repeat(5 - review.rating)}
                          </div>
                        </div>
                        <span className="text-xs text-white/60">{formatDate(review.createdAt)}</span>
                      </div>
                      <p className="text-white/60 text-sm">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60 text-center py-12">Aucun avis pour le moment</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4 mt-6">
          <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Paiements</CardTitle>
              <CardDescription className="text-white/60">
                Balance disponible: {formatPriceFromCents(stats?.availableBalance || 0)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payouts.length > 0 ? (
                <div className="space-y-3">
                  {payouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between p-4 bg-white/[0.04] rounded-lg"
                    >
                      <div>
                        <p className="text-white font-medium">{formatPriceFromCents(payout.amount)}</p>
                        <p className="text-white/60 text-sm mt-1">{payout.description}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            payout.status === 'paid'
                              ? 'bg-green-500/20 text-green-400'
                              : payout.status === 'processing'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-white/10 text-white/40'
                          }`}
                        >
                          {payout.status}
                        </span>
                        <p className="text-white/60 text-xs mt-1">
                          {formatDate(payout.scheduledDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60 text-center py-12">Aucun paiement pour le moment</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-white/60">Chiffre d'affaires total</CardDescription>
                <CardTitle className="text-2xl text-white">
                  {formatPriceFromCents(stats?.totalRevenue || 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-white/60">Paiements en attente</CardDescription>
                <CardTitle className="text-2xl text-white">
                  {formatPriceFromCents(stats?.pendingPayout || 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-white/60">Taux de conversion</CardDescription>
                <CardTitle className="text-2xl text-white">
                  {stats?.totalSales && stats.ordersCount ? ((stats.totalSales / Math.max(stats.ordersCount, 1)) * 100).toFixed(1) : '0'}%
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
          <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Performances produits</CardTitle>
              <CardDescription className="text-white/60">Classement par revenus</CardDescription>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <div className="space-y-3">
                  {[...products].sort((a, b) => b.revenue - a.revenue).map((product, idx) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-white/[0.04] rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-white/40 text-sm font-mono w-6">#{idx + 1}</span>
                        <div>
                          <p className="text-white text-sm font-medium">{product.name}</p>
                          <p className="text-white/60 text-xs">{product.sales} ventes</p>
                        </div>
                      </div>
                      <p className="text-white font-medium">{formatPriceFromCents(product.revenue)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60 text-center py-8">Aucune donnée de performance disponible</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-6">
          <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Paramètres vendeur</CardTitle>
              <CardDescription className="text-white/60">Gérez vos paramètres de marketplace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/[0.04] rounded-lg">
                  <div>
                    <p className="text-white font-medium">Compte Stripe</p>
                    <p className="text-white/60 text-sm">
                      {sellerStatus?.chargesEnabled ? 'Connecté' : 'Non connecté'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/[0.06] hover:bg-white/[0.04]"
                    onClick={handleConnectStripe}
                    disabled={isConnecting}
                  >
                    {sellerStatus?.chargesEnabled ? 'Gérer' : 'Connecter'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/[0.04] rounded-lg">
                  <div>
                    <p className="text-white font-medium">Politique de retour</p>
                    <p className="text-white/60 text-sm">Délai standard: 14 jours</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-white/[0.06] hover:bg-white/[0.04]" onClick={() => toast({ title: 'Politique de retour', description: 'Modifiez votre politique de retour depuis les paramètres Stripe.' })}>
                    Configurer
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/[0.04] rounded-lg">
                  <div>
                    <p className="text-white font-medium">Notifications vendeur</p>
                    <p className="text-white/60 text-sm">Recevez des alertes pour les nouvelles commandes</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-white/[0.06] hover:bg-white/[0.04]" onClick={() => window.location.href = '/dashboard/settings'}>
                    Gérer
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/[0.04] rounded-lg">
                  <div>
                    <p className="text-white font-medium">Balance disponible</p>
                    <p className="text-white/60 text-sm">{formatPriceFromCents(stats?.availableBalance || 0)}</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-white/[0.06] hover:bg-white/[0.04]" onClick={() => toast({ title: 'Retrait', description: 'Les retraits sont gérés automatiquement via Stripe.' })}>
                    Retirer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </PlanGate>
  );
}

