/**
 * ★★★ ADMIN CUSTOMER DETAIL PAGE ★★★
 * Page détail d'un customer avec toutes les métriques et activités
 */

'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { CustomerDetail } from '@/components/admin/customers/customer-detail';
import { useCustomerDetail } from '@/hooks/admin/use-customer-detail';

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.customerId as string;

  const {
    customer,
    activities,
    billingHistory,
    emailHistory,
    isLoading,
    isError,
    error,
  } = useCustomerDetail(customerId);

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
    />
  );
}
