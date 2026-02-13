/**
 * Hook personnalisé pour les actions sur les commandes
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { logger } from '@/lib/logger';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { trpc } from '@/lib/trpc/client';
import type { OrderStatus as DashboardOrderStatus } from '../types';
import { OrderStatus as ApiOrderStatus } from '@/lib/types/order';

// Mapping entre statuts frontend (minuscules) et backend (API enum)
const STATUS_MAPPING: Record<DashboardOrderStatus, ApiOrderStatus> = {
  pending: ApiOrderStatus.PENDING,
  processing: ApiOrderStatus.PROCESSING,
  shipped: ApiOrderStatus.SHIPPED,
  delivered: ApiOrderStatus.DELIVERED,
  cancelled: ApiOrderStatus.CANCELLED,
};

export function useOrderActions() {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();

  // Mutations
  const updateMutation = trpc.order.update.useMutation();
  const cancelMutation = trpc.order.cancel.useMutation();

  const handleUpdateStatus = useCallback(
    async (
      orderId: string,
      status: DashboardOrderStatus,
      notes?: string
    ): Promise<{ success: boolean }> => {
      try {
        await updateMutation.mutateAsync({
          id: orderId,
          status: STATUS_MAPPING[status],
          notes,
        });
        toast({
          title: t('common.success'),
          description: t('orders.statusUpdated'),
        });
        router.refresh();
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error updating order status', { error });
        toast({
          title: t('common.error'),
          description: getErrorDisplayMessage(error),
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [updateMutation, toast, router, t]
  );

  const handleCancelOrder = useCallback(
    async (orderId: string, reason?: string): Promise<{ success: boolean }> => {
      try {
        await cancelMutation.mutateAsync({ id: orderId, reason });
        toast({
          title: t('common.success'),
          description: t('orders.cancelledSuccessfully'),
        });
        router.refresh();
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error cancelling order', { error });
        toast({
          title: t('common.error'),
          description: getErrorDisplayMessage(error),
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [cancelMutation, toast, router, t]
  );

  const handleBulkUpdateStatus = useCallback(
    async (
      orderIds: string[],
      status: DashboardOrderStatus
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
          title: t('common.success'),
          description: t('orders.bulkStatusUpdated', { count: orderIds.length }),
        });
        router.refresh();
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error bulk updating orders', { error });
        toast({
          title: t('common.error'),
          description: getErrorDisplayMessage(error),
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [updateMutation, toast, router, t]
  );

  return {
    handleUpdateStatus,
    handleCancelOrder,
    handleBulkUpdateStatus,
    isUpdating: updateMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
}

