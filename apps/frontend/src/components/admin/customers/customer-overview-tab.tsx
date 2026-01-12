/**
 * ★★★ CUSTOMER OVERVIEW TAB ★★★
 * Tab Overview avec métriques détaillées et graphiques
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CustomerDetail } from '@/hooks/admin/use-customer-detail';
import { formatCurrency } from '@/lib/utils';

export interface CustomerOverviewTabProps {
  customer: CustomerDetail;
}

export function CustomerOverviewTab({ customer }: CustomerOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Usage Metrics */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Usage Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Total Sessions</span>
            <span className="text-white font-semibold">{customer.totalSessions}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Total Time Spent</span>
            <span className="text-white font-semibold">
              {Math.floor(customer.totalTimeSpent / 3600)}h{' '}
              {Math.floor((customer.totalTimeSpent % 3600) / 60)}m
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Avg Session Duration</span>
            <span className="text-white font-semibold">
              {customer.totalSessions > 0
                ? Math.floor(customer.totalTimeSpent / customer.totalSessions / 60)
                : 0}{' '}
              minutes
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Last Seen</span>
            <span className="text-white font-semibold">
              {new Date(customer.lastSeenAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Customer Info */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {customer.company && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Company</span>
              <span className="text-white font-semibold">{customer.company}</span>
            </div>
          )}
          {customer.industry && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Industry</span>
              <span className="text-white font-semibold">{customer.industry}</span>
            </div>
          )}
          {customer.country && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Country</span>
              <span className="text-white font-semibold">{customer.country}</span>
            </div>
          )}
          {customer.timezone && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Timezone</span>
              <span className="text-white font-semibold">{customer.timezone}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Segments</span>
            <div className="flex gap-2">
              {customer.segments.length > 0 ? (
                customer.segments.map((segment) => (
                  <Badge key={segment.id} variant="secondary">
                    {segment.name}
                  </Badge>
                ))
              ) : (
                <span className="text-zinc-500">None</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Card className="bg-zinc-800 border-zinc-700 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-white">Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="text-zinc-400 text-sm">Total Revenue</span>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(customer.totalRevenue)}
              </p>
            </div>
            <div>
              <span className="text-zinc-400 text-sm">Avg Monthly Revenue</span>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(customer.avgMonthlyRevenue)}
              </p>
            </div>
            <div>
              <span className="text-zinc-400 text-sm">Months Active</span>
              <p className="text-2xl font-bold text-white mt-1">
                {customer.monthsActive}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
