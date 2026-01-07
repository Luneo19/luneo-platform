/**
 * Composant ProductCard pour la vue grille
 */

'use client';

import { memo } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Package,
  Eye,
  Edit,
  Copy,
  Trash2,
  MoreVertical,
  Calendar,
} from 'lucide-react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { formatPrice, formatDate } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import { CATEGORIES, STATUS_OPTIONS } from '../../constants/products';
import type { ProductDisplay } from '../../types';

interface ProductCardProps {
  product: ProductDisplay;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

export const ProductCard = memo(function ProductCard({
  product,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onView,
}: ProductCardProps) {
  const categoryConfig =
    CATEGORIES.find((c) => c.value === product.category) || CATEGORIES[0];
  const statusConfig =
    STATUS_OPTIONS.find((s) => s.value === product.status) || STATUS_OPTIONS[0];

  return (
    <motion
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={cn(
          'overflow-hidden bg-gray-800/50 border-gray-700 hover:border-cyan-500/50 transition-all group cursor-pointer',
          isSelected && 'ring-2 ring-cyan-500 border-cyan-500'
        )}
        onClick={onView}
      >
        {/* Image */}
        <div className="aspect-square bg-gray-900 relative">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-gray-700" />
            </div>
          )}
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-white text-gray-900"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className="w-4 h-4 mr-1" />
                Modifier
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Selection Checkbox */}
          <div
            className="absolute top-2 left-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="bg-white/90"
            />
          </div>
          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <Badge
              className={cn(
                'bg-opacity-90',
                statusConfig.color === 'green'
                  ? 'bg-green-500'
                  : statusConfig.color === 'yellow'
                    ? 'bg-yellow-500'
                    : 'bg-gray-500'
              )}
            >
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate mb-1">
                {product.name}
              </h3>
              {product.description && (
                <p className="text-sm text-gray-400 line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-gray-800 border-gray-700"
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onView();
                  }}
                  className="text-white"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Voir
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="text-white"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Dupliquer
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="text-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {categoryConfig.label}
              </Badge>
            </div>
            {product.price && product.price > 0 && (
              <p className="text-lg font-bold text-cyan-400">
                {formatPrice(product.price, product.currency)}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {product.views}
            </span>
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              {product.orders}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(product.createdAt)}
            </span>
          </div>
        </div>
      </Card>
    </motion>
  );
});

