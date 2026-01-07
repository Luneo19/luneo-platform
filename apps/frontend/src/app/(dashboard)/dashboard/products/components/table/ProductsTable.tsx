/**
 * Composant ProductsTable pour la vue liste
 */

'use client';

import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ProductRow } from './ProductRow';
import type { ProductDisplay } from '../../types';

interface ProductsTableProps {
  products: ProductDisplay[];
  selectedProducts: Set<string>;
  onSelect: (productId: string) => void;
  onSelectAll: () => void;
  onEdit: (product: ProductDisplay) => void;
  onDelete: (productId: string) => void;
  onView: (productId: string) => void;
}

export function ProductsTable({
  products,
  selectedProducts,
  onSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onView,
}: ProductsTableProps) {
  const allSelected =
    products.length > 0 && selectedProducts.size === products.length;

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-4 text-left">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                />
              </th>
              <th className="p-4 text-left text-gray-300 font-medium">
                Produit
              </th>
              <th className="p-4 text-left text-gray-300 font-medium">
                Catégorie
              </th>
              <th className="p-4 text-left text-gray-300 font-medium">Prix</th>
              <th className="p-4 text-left text-gray-300 font-medium">
                Statut
              </th>
              <th className="p-4 text-left text-gray-300 font-medium">Vues</th>
              <th className="p-4 text-left text-gray-300 font-medium">
                Commandes
              </th>
              <th className="p-4 text-left text-gray-300 font-medium">Date</th>
              <th className="p-4 text-left text-gray-300 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                isSelected={selectedProducts.has(product.id)}
                onSelect={() => onSelect(product.id)}
                onEdit={() => onEdit(product)}
                onDelete={() => onDelete(product.id)}
                onView={() => onView(product.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}


