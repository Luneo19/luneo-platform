/**
 * ★★★ CUSTOMER DETAIL COMPONENT ★★★
 * Composant principal pour afficher les détails d'un customer
 * Avec tabs: Overview, Activity, Billing, Emails
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Send, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/admin/widgets/kpi-card';
import { formatCurrency, getInitials } from '@/lib/utils';
import type { CustomerDetail, CustomerActivity } from '@/hooks/admin/use-customer-detail';
import { CustomerOverviewTab } from './customer-overview-tab';
import { CustomerActivityTab } from './customer-activity-tab';
import { CustomerBillingTab } from './customer-billing-tab';
import { CustomerEmailsTab } from './customer-emails-tab';

export interface CustomerDetailProps {
  customer: CustomerDetail;
  activities: CustomerActivity[];
  billingHistory: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: Date | string;
  }>;
  emailHistory: Array<{
    id: string;
    subject: string;
    status: string;
    sentAt: Date | string;
  }>;
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  trial: 'bg-blue-500/20 text-blue-400',
  churned: 'bg-red-500/20 text-red-400',
  'at-risk': 'bg-yellow-500/20 text-yellow-400',
  none: 'bg-zinc-500/20 text-zinc-400',
};

const churnRiskColors: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

export function CustomerDetail({
  customer,
  activities,
  billingHistory,
  emailHistory,
  isLoading = false,
}: CustomerDetailProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-zinc-800 rounded animate-pulse" />
        <div className="h-96 bg-zinc-800 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/customers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Customers
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            Send Email
          </Button>
          <Button variant="outline" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Customer Info Card */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={customer.avatar || undefined} alt={customer.name} />
              <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xl">
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{customer.name}</h1>
                <Badge
                  variant="secondary"
                  className={statusColors[customer.status] || statusColors.none}
                >
                  {customer.status === 'at-risk' ? 'At Risk' : customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                </Badge>
              </div>
              <p className="text-zinc-400 mb-4">{customer.email}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">Customer since:</span>
                  <p className="text-white font-medium">
                    {new Date(customer.customerSince).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500">Plan:</span>
                  <p className="text-white font-medium">{customer.plan || 'None'}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Churn Risk:</span>
                  <p className={`font-medium ${churnRiskColors[customer.churnRisk]}`}>
                    {customer.churnRisk.charAt(0).toUpperCase() + customer.churnRisk.slice(1)}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500">Engagement:</span>
                  <p className="text-white font-medium">{customer.engagementScore}/100</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="LTV"
          value={formatCurrency(customer.ltv)}
          description={`Projected: ${formatCurrency(customer.predictedLtv)}`}
        />
        <KPICard
          title="Total Revenue"
          value={formatCurrency(customer.totalRevenue)}
          description={`Avg/month: ${formatCurrency(customer.avgMonthlyRevenue)}`}
        />
        <KPICard
          title="Time Spent"
          value={`${Math.floor(customer.totalTimeSpent / 3600)}h ${Math.floor((customer.totalTimeSpent % 3600) / 60)}m`}
          description={`${customer.totalSessions} sessions`}
        />
        <KPICard
          title="Months Active"
          value={customer.monthsActive}
          description={`Since ${new Date(customer.firstSeenAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-zinc-800 border-zinc-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-700">
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-zinc-700">
            Activity ({activities.length})
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-zinc-700">
            Billing ({billingHistory.length})
          </TabsTrigger>
          <TabsTrigger value="emails" className="data-[state=active]:bg-zinc-700">
            Emails ({emailHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <CustomerOverviewTab customer={customer} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <CustomerActivityTab activities={activities} />
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <CustomerBillingTab billingHistory={billingHistory} />
        </TabsContent>

        <TabsContent value="emails" className="mt-6">
          <CustomerEmailsTab emailHistory={emailHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
