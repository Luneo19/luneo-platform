/**
 * Hook personnalisé pour l'import de produits
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { logger } from '@/lib/logger';
import { ProductService } from '@/lib/services/ProductService';
import type { ProductCategory } from '@/lib/types/product';

export function useProductImport(onSuccess?: () => void) {
  const { toast } = useToast();
  const { t } = useI18n();
  const productService = ProductService.getInstance();
  const [importing, setImporting] = useState(false);

  const handleImport = useCallback(
    async (file: File) => {
      setImporting(true);
      try {
        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0]
          .split(',')
          .map((h) => h.trim().replace(/"/g, ''));

        const importedProducts = lines.slice(1).map((line) => {
          const values = line
            .split(',')
            .map((v) => v.trim().replace(/"/g, ''));
          const product: Record<string, string> = {};
          headers.forEach((header, index) => {
            product[header] = values[index] ?? '';
          });
          return product;
        });

        await Promise.all(
          importedProducts.map((p) =>
            productService.create({
              name: p.name,
              description: p.description,
              category: (p.category || 'OTHER') as ProductCategory,
              price: parseFloat(p.price) || 0,
              currency: p.currency || 'EUR',
            })
          )
        );

        toast({
          title: t('common.success'),
          description: t('products.importSuccess', { count: importedProducts.length }),
        });
        onSuccess?.();
      } catch (error) {
        logger.error('Error importing products', { error });
        toast({
          title: t('common.error'),
          description: t('products.importError'),
          variant: 'destructive',
        });
      } finally {
        setImporting(false);
      }
    },
    [productService, toast, onSuccess, t]
  );

  return { handleImport, importing };
}



