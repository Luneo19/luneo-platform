/**
 * Client Component pour Seller Dashboard
 * Version professionnelle améliorée
 */

'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'orders' | 'reviews' | 'payouts' | 'analytics' | 'settings'
  >('overview');
  const [isConnecting, setIsConnecting] = useState(false);

  const { sellerStatus, stats, products, orders, reviews, payouts, isLoading, refetch } =
    useSellerData();

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
        title: 'Erreur',
        description: 'Impossible de créer le compte vendeur',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-16 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <SellerHeader
        sellerStatus={sellerStatus}
        onConnectStripe={handleConnectStripe}
        isConnecting={isConnecting}
      />
      <SellerStats stats={stats} />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-gray-700">
            <Package className="w-4 h-4 mr-2" />
            Produits
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-gray-700">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Commandes
          </TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:bg-gray-700">
            <Star className="w-4 h-4 mr-2" />
            Avis
          </TabsTrigger>
          <TabsTrigger value="payouts" className="data-[state=active]:bg-gray-700">
            <Wallet className="w-4 h-4 mr-2" />
            Paiements
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-gray-700">
            <Settings className="w-4 h-4 mr-2" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Produits récents</CardTitle>
                <CardDescription>Vos produits les plus vendus</CardDescription>
              </CardHeader>
              <CardContent>
                {products.length > 0 ? (
                  <div className="space-y-3">
                    {products.slice(0, 5).map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-700 rounded" />
                          <div>
                            <p className="text-white text-sm font-medium">{product.name}</p>
                            <p className="text-gray-400 text-xs">
                              {product.sales} ventes • {formatPriceFromCents(product.revenue)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">Aucun produit</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Commandes récentes</CardTitle>
                <CardDescription>Dernières commandes</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
                      >
                        <div>
                          <p className="text-white text-sm font-medium">#{order.orderNumber}</p>
                          <p className="text-gray-400 text-xs">
                            {order.customerName} • {formatPriceFromCents(order.total)}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">Aucune commande</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4 mt-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Mes produits</CardTitle>
                  <CardDescription>{products.length} produits au total</CardDescription>
                </div>
                <Button className="bg-green-600 hover:bg-green-700">
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
                      className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-700 rounded" />
                        <div>
                          <p className="text-white font-medium">{product.name}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                            <span>{formatPriceFromCents(product.price)}</span>
                            <span>•</span>
                            <span>{product.sales} ventes</span>
                            <span>•</span>
                            <span>Stock: {product.stock}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-gray-600">
                        Modifier
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Aucun produit pour le moment</p>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Package className="w-4 h-4 mr-2" />
                    Ajouter votre premier produit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4 mt-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Commandes</CardTitle>
              <CardDescription>{orders.length} commandes au total</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg"
                    >
                      <div>
                        <p className="text-white font-medium">#{order.orderNumber}</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {order.customerName} • {order.productName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{formatPriceFromCents(order.total)}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          Commission: {formatPriceFromCents(order.commission)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-12">Aucune commande</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4 mt-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Avis clients</CardTitle>
              <CardDescription>
                {stats?.averageRating.toFixed(1)}/5 • {stats?.totalReviews} avis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-gray-900/50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white font-medium">{review.customerName}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {'★'.repeat(review.rating)}
                            {'☆'.repeat(5 - review.rating)}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                      </div>
                      <p className="text-gray-300 text-sm">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-12">Aucun avis pour le moment</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4 mt-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Paiements</CardTitle>
              <CardDescription>
                Balance disponible: {formatPriceFromCents(stats?.availableBalance || 0)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payouts.length > 0 ? (
                <div className="space-y-3">
                  {payouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg"
                    >
                      <div>
                        <p className="text-white font-medium">{formatPriceFromCents(payout.amount)}</p>
                        <p className="text-gray-400 text-sm mt-1">{payout.description}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            payout.status === 'paid'
                              ? 'bg-green-500/20 text-green-400'
                              : payout.status === 'processing'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {payout.status}
                        </span>
                        <p className="text-gray-400 text-xs mt-1">
                          {formatDate(payout.scheduledDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-12">Aucun paiement pour le moment</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Analytics</CardTitle>
              <CardDescription>Statistiques détaillées</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-center py-12">
                Analytics détaillées à venir
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Paramètres vendeur</CardTitle>
              <CardDescription>Gérez vos paramètres</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-center py-12">
                Paramètres à venir
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

