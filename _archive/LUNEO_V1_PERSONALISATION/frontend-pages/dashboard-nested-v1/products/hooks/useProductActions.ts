/**
 * Hook personnalisé pour les actions sur les produits
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { logger } from '@/lib/logger';
import { trpc } from '@/lib/trpc/client';
import { ProductService } from '@/lib/services/ProductService';
import type { Product, CreateProductRequest, UpdateProductRequest } from '@/lib/types/product';
import type { BulkAction } from '../types';

export function useProductActions() {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const productService = ProductService.getInstance();

  // Mutations
  const deleteMutation = trpc.product.delete.useMutation();
  const archiveMutation = trpc.product.update.useMutation();

  const handleCreateProduct = useCallback(
    async (productData: Partial<Product>) => {
      try {
        await productService.create(productData as CreateProductRequest);
        toast({ title: t('common.success'), description: t('products.created') });
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error creating product', { error });
        const message = getErrorDisplayMessage(error);
        toast({
          title: t('common.error'),
          description: message,
          variant: 'destructive',
        });
        return { success: false, error: message };
      }
    },
    [productService, toast, t]
  );

  const handleEditProduct = useCallback(
    async (productId: string, productData: Partial<Product>) => {
      try {
        await productService.update({ id: productId, ...productData } as UpdateProductRequest);
        toast({ title: t('common.success'), description: t('products.updated') });
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error updating product', { error });
        const msg = getErrorDisplayMessage(error);
        toast({
          title: t('common.error'),
          description: msg,
          variant: 'destructive',
        });
        return { success: false, error: msg };
      }
    },
    [productService, toast, t]
  );

  const handleDeleteProduct = useCallback(
    async (productId: string) => {
      if (!confirm(t('products.deleteConfirm'))) {
        return { success: false, cancelled: true };
      }

      try {
        await deleteMutation.mutateAsync({ id: productId });
        toast({ title: t('common.success'), description: t('products.deleted') });
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error deleting product', { error });
        const msg = getErrorDisplayMessage(error);
        toast({
          title: t('common.error'),
          description: msg,
          variant: 'destructive',
        });
        return { success: false, error: msg };
      }
    },
    [deleteMutation, toast, t]
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
              title: t('common.success'),
              description: t('products.bulkDeleted', { count: productIds.length }),
            });
            break;
          case 'archive':
            await Promise.all(
              productIds.map((id) =>
                archiveMutation.mutateAsync({
                  id,
                  isActive: false,
                })
              )
            );
            toast({
              title: t('common.success'),
              description: t('products.bulkArchived', { count: productIds.length }),
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
              title: t('common.success'),
              description: t('products.bulkActivated', { count: productIds.length }),
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
              title: t('common.success'),
              description: t('products.bulkDeactivated', { count: productIds.length }),
            });
            break;
        }
        onSuccess?.();
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error performing bulk action', { error });
        const msg = getErrorDisplayMessage(error);
        toast({
          title: t('common.error'),
          description: msg,
          variant: 'destructive',
        });
        return { success: false, error: msg };
      }
    },
    [deleteMutation, archiveMutation, toast, t]
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



