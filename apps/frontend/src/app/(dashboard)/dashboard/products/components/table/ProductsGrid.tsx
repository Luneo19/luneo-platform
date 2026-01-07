/**
 * Composant ProductsGrid pour la vue grille
 */

'use client';

import { ProductCard } from './ProductCard';
import type { ProductDisplay } from '../../types';

interface ProductsGridProps {
  products: ProductDisplay[];
  selectedProducts: Set<string>;
  onSelect: (productId: string) => void;
  onEdit: (product: ProductDisplay) => void;
  onDelete: (productId: string) => void;
  onView: (productId: string) => void;
}

export function ProductsGrid({
  products,
  selectedProducts,
  onSelect,
  onEdit,
  onDelete,
  onView,
}: ProductsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          index={index}
          isSelected={selectedProducts.has(product.id)}
          onSelect={() => onSelect(product.id)}
          onEdit={() => onEdit(product)}
          onDelete={() => onDelete(product.id)}
          onView={() => onView(product.id)}
        />
      ))}
    </div>
  );
}


