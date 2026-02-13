/**
 * Composant ProductsTable pour la vue liste
 */

'use client';

import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useI18n } from '@/i18n/useI18n';
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
  const { t } = useI18n();
  const allSelected =
    products.length > 0 && selectedProducts.size === products.length;

  return (
    <Card className="bg-white border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="p-4 text-left">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                />
              </th>
              <th className="p-4 text-left text-gray-700 font-medium">
                {t('products.product')}
              </th>
              <th className="p-4 text-left text-gray-700 font-medium">
                {t('products.category')}
              </th>
              <th className="p-4 text-left text-gray-700 font-medium">{t('products.price')}</th>
              <th className="p-4 text-left text-gray-700 font-medium">
                {t('products.status')}
              </th>
              <th className="p-4 text-left text-gray-700 font-medium">{t('products.views')}</th>
              <th className="p-4 text-left text-gray-700 font-medium">
                {t('products.ordersCount')}
              </th>
              <th className="p-4 text-left text-gray-700 font-medium">{t('products.date')}</th>
              <th className="p-4 text-left text-gray-700 font-medium">
                {t('products.actions')}
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



