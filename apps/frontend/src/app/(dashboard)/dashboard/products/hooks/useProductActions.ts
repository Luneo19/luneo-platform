/**
 * Hook personnalisé pour les actions sur les produits
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { trpc } from '@/lib/trpc/client';
import { ProductService } from '@/lib/services/ProductService';
import type { Product } from '@/lib/types/product';
import type { BulkAction } from '../types';

export function useProductActions() {
  const router = useRouter();
  const { toast } = useToast();
  const productService = ProductService.getInstance();

  // Mutations
  const deleteMutation = trpc.product.delete.useMutation();
  const archiveMutation = trpc.product.update.useMutation();

  const handleCreateProduct = useCallback(
    async (productData: Partial<Product>) => {
      try {
        await productService.create(productData as Record<string, unknown>);
        toast({ title: 'Succès', description: 'Produit créé avec succès' });
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error creating product', { error });
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        toast({
          title: 'Erreur',
          description: message,
          variant: 'destructive',
        });
        return { success: false, error: message };
      }
    },
    [productService, toast]
  );

  const handleEditProduct = useCallback(
    async (productId: string, productData: Partial<Product>) => {
      try {
        await productService.update({ id: productId, ...productData } as Record<string, unknown>);
        toast({ title: 'Succès', description: 'Produit mis à jour' });
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error updating product', { error });
        const msg = error instanceof Error ? error.message : 'Erreur inconnue';
        toast({
          title: 'Erreur',
          description: msg,
          variant: 'destructive',
        });
        return { success: false, error: msg };
      }
    },
    [productService, toast]
  );

  const handleDeleteProduct = useCallback(
    async (productId: string) => {
      if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
        return { success: false, cancelled: true };
      }

      try {
        await deleteMutation.mutateAsync({ id: productId });
        toast({ title: 'Succès', description: 'Produit supprimé' });
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error deleting product', { error });
        const msg = error instanceof Error ? error.message : 'Erreur inconnue';
        toast({
          title: 'Erreur',
          description: msg,
          variant: 'destructive',
        });
        return { success: false, error: msg };
      }
    },
    [deleteMutation, toast]
  );

  const handleBulkAction = useCallback(
    async (
      action: BulkAction['type'],
      productIds: string[],
      onSuccess?: () => void
    ) => {
      try {
        switch (action) {
          case 'delete':
            await Promise.all(
              productIds.map((id) => deleteMutation.mutateAsync({ id }))
            );
            toast({
              title: 'Succès',
              description: `${productIds.length} produit(s) supprimé(s)`,
            });
            break;
          case 'archive':
            await Promise.all(
              productIds.map((id) =>
                archiveMutation.mutateAsync({
                  id,
                  status: 'ARCHIVED',
                })
              )
            );
            toast({
              title: 'Succès',
              description: `${productIds.length} produit(s) archivé(s)`,
            });
            break;
          case 'activate':
            await Promise.all(
              productIds.map((id) =>
                archiveMutation.mutateAsync({
                  id,
                  isActive: true,
                })
              )
            );
            toast({
              title: 'Succès',
              description: `${productIds.length} produit(s) activé(s)`,
            });
            break;
          case 'deactivate':
            await Promise.all(
              productIds.map((id) =>
                archiveMutation.mutateAsync({
                  id,
                  isActive: false,
                })
              )
            );
            toast({
              title: 'Succès',
              description: `${productIds.length} produit(s) désactivé(s)`,
            });
            break;
        }
        onSuccess?.();
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error performing bulk action', { error });
        const msg = error instanceof Error ? error.message : 'Erreur lors de l\'action';
        toast({
          title: 'Erreur',
          description: 'Erreur lors de l\'action',
          variant: 'destructive',
        });
        return { success: false, error: msg };
      }
    },
    [deleteMutation, archiveMutation, toast]
  );

  return {
    handleCreateProduct,
    handleEditProduct,
    handleDeleteProduct,
    handleBulkAction,
    isDeleting: deleteMutation.isPending,
    isArchiving: archiveMutation.isPending,
  };
}



