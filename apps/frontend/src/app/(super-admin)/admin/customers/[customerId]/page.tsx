/**
 * ★★★ ADMIN CUSTOMER DETAIL PAGE ★★★
 * Page détail d'un customer avec toutes les métriques et activités
 */

'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CustomerDetail } from '@/components/admin/customers/customer-detail';
import { useCustomerDetail } from '@/hooks/admin/use-customer-detail';
import { api } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { logger } from '@/lib/logger';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const customerId = params.customerId as string;
  const [isMutating, setIsMutating] = React.useState(false);

  const {
    customer,
    activities,
    billingHistory,
    emailHistory,
    isLoading,
    isError,
    error,
    refresh,
  } = useCustomerDetail(customerId);

  const handleToggleActive = React.useCallback(async () => {
    if (!customer) return;
    setIsMutating(true);
    try {
      await api.patch(`/api/admin/customers/${customerId}`, {
        isActive: customer.isActive === false,
      });
      await refresh();
      toast({
        title: 'Client mis à jour',
        description: customer.isActive === false ? 'Le client a été réactivé.' : 'Le client a été désactivé.',
      });
    } catch (e) {
      logger.error('Failed to toggle customer active state', e);
      toast({
        variant: 'destructive',
        title: 'Échec de la mise à jour',
        description: getErrorDisplayMessage(e),
      });
    } finally {
      setIsMutating(false);
    }
  }, [customer, customerId, refresh, toast]);

  const handleDelete = React.useCallback(async () => {
    if (!customer) return;
    if (!window.confirm(`Supprimer définitivement ${customer.email} ?`)) return;

    setIsMutating(true);
    try {
      await api.delete(`/api/admin/customers/${customerId}`);
      toast({
        title: 'Client supprimé',
        description: `${customer.email} a été supprimé.`,
      });
      router.push('/admin/customers');
    } catch (e) {
      logger.error('Failed to delete customer', e);
      toast({
        variant: 'destructive',
        title: 'Échec de suppression',
        description: getErrorDisplayMessage(e),
      });
    } finally {
      setIsMutating(false);
    }
  }, [customer, customerId, router, toast]);

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="text-red-500">
          {error?.message || 'Failed to load customer details'}
        </div>
      </div>
    );
  }

  if (!customer && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-zinc-400">Customer not found</div>
      </div>
    );
  }

  return (
    <CustomerDetail
      customer={customer!}
      activities={activities}
      billingHistory={billingHistory}
      emailHistory={emailHistory}
      isLoading={isLoading}
      isMutating={isMutating}
      onToggleActive={handleToggleActive}
      onDelete={handleDelete}
    />
  );
}
