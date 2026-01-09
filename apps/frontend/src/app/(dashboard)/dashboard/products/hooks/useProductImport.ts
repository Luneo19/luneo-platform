/**
 * Hook personnalisé pour l'import de produits
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { ProductService } from '@/lib/services/ProductService';

export function useProductImport(onSuccess?: () => void) {
  const { toast } = useToast();
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
          const product: any = {};
          headers.forEach((header, index) => {
            product[header] = values[index];
          });
          return product;
        });

        await Promise.all(
          importedProducts.map((p) =>
            productService.create({
              name: p.name,
              description: p.description,
              category: p.category || 'OTHER',
              price: parseFloat(p.price) || 0,
              currency: p.currency || 'EUR',
            } as any)
          )
        );

        toast({
          title: 'Succès',
          description: `${importedProducts.length} produits importés`,
        });
        onSuccess?.();
      } catch (error) {
        logger.error('Error importing products', { error });
        toast({
          title: 'Erreur',
          description: 'Erreur lors de l\'import',
          variant: 'destructive',
        });
      } finally {
        setImporting(false);
      }
    },
    [productService, toast, onSuccess]
  );

  return { handleImport, importing };
}



