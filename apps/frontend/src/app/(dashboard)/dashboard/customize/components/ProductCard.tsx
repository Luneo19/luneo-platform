'use client';

/**
 * ProductCard - Carte produit pour vue grid
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
import type { Product } from '@/lib/types/product';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const thumbnail = product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/400`;
  const views = (product.metadata?.views as number) || 0;
  const favorites = (product.metadata?.favorites as number) || 0;

  return (
    <Card className="bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-colors group">
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          <img
            src={thumbnail}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              onClick={() => router.push(`/dashboard/customize/${product.id}`)}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Box className="w-4 h-4 mr-2" />
              Configurer
            </Button>
          </div>
          <Badge className="absolute top-2 right-2 bg-cyan-600">
            {product.category}
          </Badge>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-white line-clamp-2 flex-1">{product.name}</h3>
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
            <p className="text-sm text-slate-400 line-clamp-2 mb-3">{product.description}</p>
          )}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {views}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {favorites}
              </span>
            </div>
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
      </CardContent>
    </Card>
  );
}






