/**
 * ★★★ CUSTOMER BILLING TAB ★★★
 * Tab Billing avec historique des paiements
 */

'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

export interface CustomerBillingTabProps {
  billingHistory: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: Date | string;
  }>;
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  failed: 'bg-red-500/20 text-red-400',
};

export function CustomerBillingTab({ billingHistory }: CustomerBillingTabProps) {
  if (billingHistory.length === 0) {
    return (
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="p-8 text-center text-zinc-500">
          No billing history found for this customer.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-700">
              <TableHead className="text-zinc-400">Date</TableHead>
              <TableHead className="text-zinc-400">Amount</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billingHistory.map((item) => (
              <TableRow key={item.id} className="border-zinc-700">
                <TableCell className="text-white">
                  {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </TableCell>
                <TableCell className="text-white font-semibold">
                  {formatCurrency(item.amount)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={statusColors[item.status] || 'bg-zinc-500/20 text-zinc-400'}
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
