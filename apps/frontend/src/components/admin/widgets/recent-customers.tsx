/**
 * ★★★ RECENT CUSTOMERS ★★★
 * Table des clients récents avec avatars et badges
 * Utilisé dans le dashboard overview
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export interface RecentCustomer {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  plan: string | null;
  mrr: number;
  ltv: number;
  status: 'active' | 'trial' | 'churned' | 'at-risk';
  customerSince: Date | string;
}

export interface RecentCustomersProps {
  customers: RecentCustomer[];
  isLoading?: boolean;
  limit?: number;
  className?: string;
}

const statusColors: Record<RecentCustomer['status'], string> = {
  active: 'bg-green-500/20 text-green-400',
  trial: 'bg-blue-500/20 text-blue-400',
  churned: 'bg-red-500/20 text-red-400',
  'at-risk': 'bg-yellow-500/20 text-yellow-400',
};

const statusLabels: Record<RecentCustomer['status'], string> = {
  active: 'Active',
  trial: 'Trial',
  churned: 'Churned',
  'at-risk': 'At Risk',
};

export function RecentCustomers({
  customers,
  isLoading = false,
  limit = 5,
  className,
}: RecentCustomersProps) {
  const displayCustomers = customers.slice(0, limit);

  if (isLoading) {
    return (
      <Card className={cn('bg-white/[0.03] border-white/[0.06]', className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Recent Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 bg-white/[0.06] rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-3 w-48 bg-white/[0.06] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-white/[0.03] border-white/[0.06]', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-white">Recent Customers</CardTitle>
        {customers.length > limit && (
          <Link
            href="/admin/customers"
            className="text-sm text-white/80 hover:text-white flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {displayCustomers.length === 0 ? (
          <div className="text-center py-8 text-white/70">
            <p>No customers yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayCustomers.map((customer) => (
              <RecentCustomerRow key={customer.id} customer={customer} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentCustomerRow({ customer }: { customer: RecentCustomer }) {
  const initials = customer.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link
      href={`/admin/customers/${customer.id}`}
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-700/50 transition-colors group"
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={customer.avatar || undefined} alt={customer.name} />
        <AvatarFallback className="bg-zinc-700 text-zinc-300">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate group-hover:text-white">
              {customer.name}
            </p>
            <p className="text-xs text-zinc-300 truncate">{customer.email}</p>
          </div>
          <Badge
            variant="secondary"
            className={cn('text-xs', statusColors[customer.status])}
          >
            {statusLabels[customer.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-white/70">
          {customer.plan && (
            <span className="capitalize">{customer.plan}</span>
          )}
          <span>MRR: {formatCurrency(customer.mrr)}</span>
          <span>LTV: {formatCurrency(customer.ltv)}</span>
        </div>
      </div>
    </Link>
  );
}
