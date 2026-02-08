/**
 * Hook personnalisé pour les actions sur les commandes
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { trpc } from '@/lib/trpc/client';
import type { OrderStatus } from '../types';

// Mapping entre statuts frontend (minuscules) et backend (Prisma enum)
const STATUS_MAPPING: Record<OrderStatus, 'CREATED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'> = {
  pending: 'CREATED',
  processing: 'CONFIRMED',
  shipped: 'SHIPPED',
  delivered: 'DELIVERED',
  cancelled: 'CANCELLED',
};

export function useOrderActions() {
  const router = useRouter();
  const { toast } = useToast();

  // Mutations
  const updateMutation = trpc.order.update.useMutation();
  const cancelMutation = trpc.order.cancel.useMutation();

  const handleUpdateStatus = useCallback(
    async (
      orderId: string,
      status: OrderStatus,
      notes?: string
    ): Promise<{ success: boolean }> => {
      try {
        await updateMutation.mutateAsync({
          id: orderId,
          status: STATUS_MAPPING[status],
          notes,
        });
        toast({
          title: 'Succès',
          description: 'Statut de la commande mis à jour',
        });
        router.refresh();
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error updating order status', { error });
        toast({
          title: 'Erreur',
          description: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [updateMutation, toast, router]
  );

  const handleCancelOrder = useCallback(
    async (orderId: string, reason?: string): Promise<{ success: boolean }> => {
      try {
        await cancelMutation.mutateAsync({ id: orderId, reason });
        toast({
          title: 'Succès',
          description: 'Commande annulée',
        });
        router.refresh();
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error cancelling order', { error });
        toast({
          title: 'Erreur',
          description: error instanceof Error ? error.message : 'Erreur lors de l\'annulation',
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [cancelMutation, toast, router]
  );

  const handleBulkUpdateStatus = useCallback(
    async (
      orderIds: string[],
      status: OrderStatus
    ): Promise<{ success: boolean }> => {
      try {
        await Promise.all(
          orderIds.map((id) =>
            updateMutation.mutateAsync({
              id,
              status: STATUS_MAPPING[status],
            })
          )
        );
        toast({
          title: 'Succès',
          description: `${orderIds.length} commande(s) mises à jour`,
        });
        router.refresh();
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error bulk updating orders', { error });
        toast({
          title: 'Erreur',
          description: 'Erreur lors de la mise à jour en masse',
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [updateMutation, toast, router]
  );

  return {
    handleUpdateStatus,
    handleCancelOrder,
    handleBulkUpdateStatus,
    isUpdating: updateMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
}

