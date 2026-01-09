'use client';

/**
 * AnalyticsTab - Onglet analytics
 * Composant < 300 lignes
 */

import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, Eye, Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product } from '@/lib/types/product';

interface AnalyticsTabProps {
  products: Product[];
}

export function AnalyticsTab({ products }: AnalyticsTabProps) {
  const analytics = useMemo(() => {
    const totalViews = products.reduce((sum, p) => sum + ((p.metadata?.views as number) || 0), 0);
    const totalFavorites = products.reduce((sum, p) => sum + ((p.metadata?.favorites as number) || 0), 0);
    const totalDesigns = products.reduce((sum, p) => sum + ((p.metadata?.designsCount as number) || 0), 0);
    const avgViewsPerProduct = products.length > 0 ? Math.round(totalViews / products.length) : 0;

    return {
      totalViews,
      totalFavorites,
      totalDesigns,
      avgViewsPerProduct,
    };
  }, [products]);

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Analytics de personnalisation
          </CardTitle>
          <CardDescription className="text-slate-400">
            Statistiques et métriques de vos produits personnalisables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Eye className="w-8 h-8 text-cyan-400" />
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">{analytics.totalViews.toLocaleString()}</p>
                <p className="text-sm text-slate-400">Vues totales</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="w-8 h-8 text-pink-400" />
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">{analytics.totalFavorites.toLocaleString()}</p>
                <p className="text-sm text-slate-400">Favoris</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-8 h-8 text-blue-400" />
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">{analytics.totalDesigns.toLocaleString()}</p>
                <p className="text-sm text-slate-400">Designs créés</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Eye className="w-8 h-8 text-purple-400" />
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">{analytics.avgViewsPerProduct.toLocaleString()}</p>
                <p className="text-sm text-slate-400">Moyenne vues/produit</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}







