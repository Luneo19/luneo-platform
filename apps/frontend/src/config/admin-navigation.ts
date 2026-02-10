/**
 * ADMIN NAVIGATION CONFIG
 * Configuration de la navigation pour le Super Admin Dashboard
 *
 * Architecture:
 * - ORION: Hub strategique (KPIs, AI insights, health scores, segments, experiments)
 * - Gestion: Operations quotidiennes (brands, customers, analytics, billing, audit)
 * - Marketing: Automations, templates, communications
 * - Systeme: Webhooks, events, settings, AI management
 */

import {
  LayoutDashboard,
  Users,
  BarChart3,
  Mail,
  Webhook,
  Activity,
  Settings,
  Zap,
  TrendingUp,
  FileText,
  Sparkles,
  Bell,
  Download,
  Building2,
  CreditCard,
  ClipboardList,
  Beaker,
  Target,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
}

export interface NavigationGroup {
  title?: string;
  items: NavItem[];
}

export const adminNavigation: NavigationGroup[] = [
  // ─── ORION - Hub Strategique ───
  {
    items: [
      {
        title: 'ORION Command Center',
        href: '/admin/orion',
        icon: Sparkles,
        children: [
          {
            title: 'Health Dashboard',
            href: '/admin/orion/retention',
            icon: Activity,
          },
          {
            title: 'Segments',
            href: '/admin/orion/segments',
            icon: Target,
          },
          {
            title: 'Experiments',
            href: '/admin/orion/experiments',
            icon: Beaker,
          },
          {
            title: 'Quick Wins',
            href: '/admin/orion/quick-wins',
            icon: Zap,
          },
          {
            title: 'Notifications',
            href: '/admin/orion/notifications',
            icon: Bell,
          },
          {
            title: 'Exports',
            href: '/admin/orion/export',
            icon: Download,
          },
        ],
      },
    ],
  },
  // ─── Overview ───
  {
    items: [
      {
        title: 'Overview',
        href: '/admin',
        icon: LayoutDashboard,
      },
    ],
  },
  // ─── Gestion Operationnelle ───
  {
    title: 'Gestion',
    items: [
      {
        title: 'Brands',
        href: '/admin/brands',
        icon: Building2,
        badge: 'new',
      },
      {
        title: 'Customers',
        href: '/admin/customers',
        icon: Users,
        badge: 'live',
      },
      {
        title: 'Analytics',
        href: '/admin/analytics',
        icon: BarChart3,
        children: [
          {
            title: 'Overview',
            href: '/admin/analytics',
            icon: BarChart3,
          },
          {
            title: 'Advanced',
            href: '/admin/analytics/advanced',
            icon: TrendingUp,
          },
        ],
      },
      {
        title: 'Billing',
        href: '/admin/billing',
        icon: CreditCard,
        badge: 'new',
      },
      {
        title: 'Audit Log',
        href: '/admin/audit-log',
        icon: ClipboardList,
      },
    ],
  },
  // ─── Marketing ───
  {
    title: 'Marketing',
    items: [
      {
        title: 'Email Marketing',
        href: '/admin/marketing',
        icon: Mail,
        children: [
          {
            title: 'Automations',
            href: '/admin/marketing/automations',
            icon: Sparkles,
          },
          {
            title: 'Templates',
            href: '/admin/marketing/templates',
            icon: FileText,
          },
          {
            title: 'Communications Log',
            href: '/admin/marketing/communications',
            icon: Mail,
          },
        ],
      },
    ],
  },
  // ─── Systeme ───
  {
    title: 'Système',
    items: [
      {
        title: 'Webhooks',
        href: '/admin/webhooks',
        icon: Webhook,
      },
      {
        title: 'Events',
        href: '/admin/events',
        icon: Activity,
      },
      {
        title: 'Settings',
        href: '/admin/settings',
        icon: Settings,
      },
    ],
  },
];
