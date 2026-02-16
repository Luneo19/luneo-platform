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
  Bot,
  Receipt,
  History,
  Palette,
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
          { title: 'Overview', href: '/admin/orion', icon: LayoutDashboard },
          { title: 'Agents', href: '/admin/orion/agents', icon: Bot },
          { title: 'Automations', href: '/admin/orion/automations', icon: Zap },
          { title: 'Communications', href: '/admin/orion/communications', icon: Mail },
          { title: 'Health Dashboard', href: '/admin/orion/retention', icon: Activity },
          { title: 'Segments', href: '/admin/orion/segments', icon: Target },
          { title: 'Experiments', href: '/admin/orion/experiments', icon: Beaker },
          { title: 'Analytics', href: '/admin/orion/analytics', icon: BarChart3 },
          { title: 'Quick Wins', href: '/admin/orion/quick-wins', icon: Zap },
          { title: 'Notifications', href: '/admin/orion/notifications', icon: Bell },
          { title: 'Exports', href: '/admin/orion/export', icon: Download },
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
        title: 'Factures',
        href: '/admin/invoices',
        icon: Receipt,
      },
      {
        title: 'Historique Plans',
        href: '/admin/plan-history',
        icon: History,
      },
      {
        title: 'Designs',
        href: '/admin/designs',
        icon: Palette,
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
