/**
 * Composant ProductRow pour la vue liste
 */

'use client';

import { memo } from 'react';
import Image from 'next/image';
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
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import { CATEGORIES, STATUS_OPTIONS } from '../../constants/products';
import type { ProductDisplay } from '../../types';

interface ProductRowProps {
  product: ProductDisplay;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

export const ProductRow = memo(function ProductRow({
  product,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onView,
}: ProductRowProps) {
  const categoryConfig =
    CATEGORIES.find((c) => c.value === product.category) || CATEGORIES[0];
  const statusConfig =
    STATUS_OPTIONS.find((s) => s.value === product.status) || STATUS_OPTIONS[0];

  return (
    <tr className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
      <td className="p-4">
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gray-900 relative overflow-hidden flex-shrink-0">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-700" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-white truncate">{product.name}</h3>
            {product.sku && (
              <p className="text-xs text-gray-500">SKU: {product.sku}</p>
            )}
          </div>
        </div>
      </td>
      <td className="p-4">
        <Badge variant="outline" className="text-xs">
          {categoryConfig.label}
        </Badge>
      </td>
      <td className="p-4">
        {product.price && product.price > 0 ? (
          <span className="font-medium text-white">
            {formatPrice(product.price, product.currency)}
          </span>
        ) : (
          <span className="text-gray-500">—</span>
        )}
      </td>
      <td className="p-4">
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
      </td>
      <td className="p-4">
        <span className="text-gray-400">{product.views}</span>
      </td>
      <td className="p-4">
        <span className="text-gray-400">{product.orders}</span>
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-400">
          {formatDate(product.createdAt)}
        </span>
      </td>
      <td className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
            <DropdownMenuItem onClick={onView} className="text-white">
              <Eye className="w-4 h-4 mr-2" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit} className="text-white">
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white">
              <Copy className="w-4 h-4 mr-2" />
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem onClick={onDelete} className="text-red-400">
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
});

