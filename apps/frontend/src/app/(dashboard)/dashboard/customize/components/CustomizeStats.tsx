'use client';

/**
 * CustomizeStats - Statistiques de personnalisation
 * Composant < 300 lignes
 */

import React, { useMemo } from 'react';
import { Package, Palette, Layers, Eye, Heart, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types/product';

interface CustomizeStatsProps {
  products: Product[];
}

export function CustomizeStats({ products }: CustomizeStatsProps) {
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const customizableProducts = products.filter(p => p.model3dUrl || p.baseAssetUrl).length;
    const activeProducts = products.filter(p => p.isActive && p.status === 'ACTIVE').length;
    const totalViews = products.reduce((sum, p) => sum + ((p.metadata?.views as number) || 0), 0);
    const totalFavorites = products.reduce((sum, p) => sum + ((p.metadata?.favorites as number) || 0), 0);
    const avgDesignsPerProduct = products.length > 0
      ? products.reduce((sum, p) => sum + ((p.metadata?.designsCount as number) || 0), 0) / products.length
      : 0;

    return {
      totalProducts,
      customizableProducts,
      activeProducts,
      totalViews,
      totalFavorites,
      avgDesignsPerProduct: Math.round(avgDesignsPerProduct * 10) / 10,
    };
  }, [products]);

  const statCards = [
    { label: 'Total produits', value: stats.totalProducts, color: 'cyan', icon: Package },
    { label: 'Personnalisables', value: stats.customizableProducts, color: 'green', icon: Palette },
    { label: 'Designs total', value: stats.totalProducts, color: 'blue', icon: Layers },
    { label: 'Vues totales', value: stats.totalViews.toLocaleString(), color: 'purple', icon: Eye },
    { label: 'Favoris', value: stats.totalFavorites, color: 'pink', icon: Heart },
    { label: 'Moyenne designs', value: stats.avgDesignsPerProduct, color: 'orange', icon: BarChart3 },
  ];

  const colorClasses: Record<string, { bg: string; text: string; iconBg: string }> = {
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', iconBg: 'bg-cyan-500/10' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', iconBg: 'bg-green-500/10' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', iconBg: 'bg-blue-500/10' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', iconBg: 'bg-purple-500/10' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', iconBg: 'bg-pink-500/10' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', iconBg: 'bg-orange-500/10' },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const colors = colorClasses[stat.color] || colorClasses.cyan;
        return (
          <motion
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={cn('p-4 bg-slate-900/50 border-slate-700', colors.bg)}>
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{stat.label}</p>
                    <p className={cn('text-2xl font-bold mt-2', colors.text)}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={cn('p-3 rounded-lg', colors.iconBg)}>
                    <Icon className={cn('w-5 h-5', colors.text)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion>
        );
      })}
    </div>
  );
}






