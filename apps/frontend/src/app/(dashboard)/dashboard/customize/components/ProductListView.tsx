'use client';

/**
 * ProductListView - Vue liste des produits
 * Composant < 300 lignes
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { Box, Eye, Heart, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import type { Product } from '@/lib/types/product';
import { cn } from '@/lib/utils';

interface ProductListViewProps {
  products: Product[];
}

export function ProductListView({ products }: ProductListViewProps) {
  const router = useRouter();

  return (
    <div className="space-y-2">
      {products.map((product, index) => {
        const thumbnail = product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/400`;
        const views = (product.metadata?.views as number) || 0;
        const favorites = (product.metadata?.favorites as number) || 0;

        return (
          <motion
            key={product.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={thumbnail}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-white truncate">{product.name}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Modifier</DropdownMenuItem>
                          <DropdownMenuItem>Dupliquer</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400">Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {product.description && (
                      <p className="text-sm text-slate-400 line-clamp-1 mb-2">{product.description}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="border-slate-600">
                        {product.category}
                      </Badge>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {views}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {favorites}
                      </span>
                      <Badge
                        variant={product.isActive ? 'default' : 'secondary'}
                        className={cn(
                          product.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                        )}
                      >
                        {product.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push(`/dashboard/customize/${product.id}`)}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Box className="w-4 h-4 mr-2" />
                    Configurer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion>
        );
      })}
    </div>
  );
}







