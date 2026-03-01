/**
 * ★★★ QUICK ACTIONS ★★★
 * Grille d'actions rapides pour le dashboard admin
 * Actions fréquentes avec gradients et tooltips
 */

'use client';

import React from 'react';
import Link from 'next/link';
import {
  Mail,
  Download,
  Users,
  TrendingUp,
  Zap,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  gradient: string;
  description?: string;
}

const defaultActions: QuickAction[] = [
  {
    id: 'send-campaign',
    label: 'Send Campaign',
    icon: Mail,
    href: '/admin/marketing/campaigns',
    gradient: 'from-blue-500 to-cyan-500',
    description: 'Open campaign management',
  },
  {
    id: 'export-customers',
    label: 'Export Customers',
    icon: Download,
    href: '/admin/customers?export=csv',
    gradient: 'from-green-500 to-emerald-500',
    description: 'Export customer data to CSV',
  },
  {
    id: 'view-churning',
    label: 'View Churning',
    icon: TrendingUp,
    href: '/admin/customers?status=at-risk',
    gradient: 'from-red-500 to-orange-500',
    description: 'See customers at risk',
  },
  {
    id: 'create-segment',
    label: 'Create Segment',
    icon: Users,
    href: '/admin/orion/segments',
    gradient: 'from-purple-500 to-pink-500',
    description: 'Open segmentation workspace',
  },
  {
    id: 'view-analytics',
    label: 'View Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
    gradient: 'from-indigo-500 to-blue-500',
    description: 'View detailed analytics',
  },
  {
    id: 'manage-webhooks',
    label: 'Manage Webhooks',
    icon: Zap,
    href: '/admin/webhooks',
    gradient: 'from-yellow-500 to-orange-500',
    description: 'Configure webhooks',
  },
];

export interface QuickActionsProps {
  actions?: QuickAction[];
  className?: string;
}

export function QuickActions({ actions = defaultActions, className }: QuickActionsProps) {
  return (
    <Card className={cn('bg-white/[0.03] border-white/[0.06]', className)}>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action) => (
            <QuickActionButton key={action.id} action={action} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionButton({ action }: { action: QuickAction }) {
  const Icon = action.icon;

  return (
    <Link
      href={action.href}
      className={cn(
        'group relative overflow-hidden rounded-lg p-4',
        'bg-gradient-to-br',
        action.gradient,
        'hover:scale-105 transition-transform duration-200',
        'border border-white/10',
      )}
    >
      <div className="relative z-10 flex flex-col items-center gap-2 text-center">
        <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span className="text-sm font-medium text-white">{action.label}</span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
