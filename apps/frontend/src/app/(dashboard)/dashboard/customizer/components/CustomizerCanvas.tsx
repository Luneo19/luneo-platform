'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Plus, History, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { formatPrice } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '../data';
import type { DesignTemplate, Asset } from '../types';

export interface CustomizerProduct {
  id: string;
  name: string;
  description?: string;
  category: string;
  image_url: string;
  price: number;
  currency: string;
  isActive: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  brandId: string;
  createdBy: string;
}

export interface CustomizerCanvasProps {
  activeTab: string;
  viewMode: 'grid' | 'list';
  products: CustomizerProduct[];
  productsLoading: boolean;
  templates: DesignTemplate[];
  assets: Asset[];
  onOpenCustomizer: (product: CustomizerProduct) => void;
}

export function CustomizerCanvas({
  activeTab,
  viewMode,
  products,
  productsLoading,
  templates,
  assets,
  onOpenCustomizer,
}: CustomizerCanvasProps) {
  const router = useRouter();

  return (
    <>
      <TabsContent value="products" className="space-y-6">
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="bg-gray-50 border-gray-200 animate-pulse">
                <CardContent className="p-0">
                  <div className="aspect-square bg-gray-200 rounded-t-lg" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 text-gray-400 mx-auto mb-4 flex items-center justify-center">
                <Edit className="w-16 h-16" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun produit trouvé</h3>
              <p className="text-gray-600 mb-6">
                Créez votre premier produit pour commencer à personnaliser
              </p>
              <Button
                onClick={() => router.push('/dashboard/products')}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer un produit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div
            className={cn(
              'gap-6',
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'flex flex-col'
            )}
          >
            <AnimatePresence mode="popLayout">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-white border-gray-200 hover:border-cyan-500/50 transition-all cursor-pointer group">
                    <CardContent className="p-0">
                      <div className="relative aspect-square overflow-hidden rounded-t-lg">
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            onClick={() => onOpenCustomizer(product)}
                            className="bg-cyan-600 hover:bg-cyan-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Personnaliser
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="border-gray-200">
                            {CATEGORIES.find((c) => c.value === product.category)?.label ?? 'Autre'}
                          </Badge>
                          <span className="text-sm font-semibold text-cyan-400">
                            {formatPrice(product.price, product.currency)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </TabsContent>

      <TabsContent value="templates" className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="bg-white border-gray-200 hover:border-cyan-500/50 transition-all cursor-pointer"
            >
              <CardContent className="p-0">
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                  <Image
                    src={template.thumbnail}
                    alt={template.name}
                    fill
                    className="object-cover"
                  />
                  {template.isPremium && (
                    <Badge className="absolute top-2 right-2 bg-amber-500">
                      <Star className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{template.category}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      {template.rating}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="assets" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {assets.map((asset) => (
            <Card
              key={asset.id}
              className="bg-gray-800/50 border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer group"
            >
              <CardContent className="p-2">
                <div className="relative aspect-square overflow-hidden rounded-lg mb-2">
                  <Image
                    src={asset.thumbnail ?? asset.thumbnailUrl ?? asset.url}
                    alt={asset.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <p className="text-xs text-gray-900 text-center truncate">{asset.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="history" className="space-y-6">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Historique des designs</CardTitle>
            <CardDescription className="text-gray-600">
              Consultez vos designs précédents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-600">
              <History className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p>Aucun design dans l&apos;historique</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </>
  );
}
