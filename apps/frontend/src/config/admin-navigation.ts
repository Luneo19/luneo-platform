/**
 * ★★★ ADMIN NAVIGATION CONFIG ★★★
 * Configuration de la navigation pour le Super Admin Dashboard
 */

import {
  LayoutDashboard,
  Users,
  BarChart3,
  Mail,
  Megaphone,
  Webhook,
  Activity,
  Settings,
  Zap,
  DollarSign,
  TrendingUp,
  Target,
  FileText,
  Sparkles,
  Shield,
  Bell,
  MessageSquare,
  Beaker,
  Download,
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
  {
    items: [
      {
        title: 'ORION Command Center',
        href: '/admin/orion',
        icon: Sparkles,
        children: [
          {
            title: 'ATHENA - Segments',
            href: '/admin/orion/segments',
            icon: Target,
          },
          {
            title: 'ATHENA - Onboarding',
            href: '/admin/orion/agents/athena',
            icon: Sparkles,
          },
          {
            title: 'ZEUS - Analytics',
            href: '/admin/orion/agents/zeus',
            icon: BarChart3,
          },
          {
            title: 'ARTEMIS - Retention',
            href: '/admin/orion/agents/artemis',
            icon: Shield,
          },
          {
            title: 'Health Dashboard',
            href: '/admin/orion/retention',
            icon: Activity,
          },
          {
            title: 'Communications (HERMES)',
            href: '/admin/orion/communications',
            icon: MessageSquare,
          },
          {
            title: 'HADES - Revenue',
            href: '/admin/orion/agents/hades',
            icon: TrendingUp,
          },
          {
            title: 'APOLLO - Acquisition',
            href: '/admin/orion/agents/apollo',
            icon: Zap,
          },
          {
            title: 'Experiments',
            href: '/admin/orion/experiments',
            icon: Beaker,
          },
          {
            title: 'Templates',
            href: '/admin/orion/templates',
            icon: FileText,
          },
          {
            title: 'Quick Wins',
            href: '/admin/orion/quick-wins',
            icon: Zap,
          },
          {
            title: 'Journal d\'Audit',
            href: '/admin/orion/audit-log',
            icon: FileText,
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
  {
    items: [
      {
        title: 'Overview',
        href: '/admin',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Gestion',
    items: [
      {
        title: 'Customers',
        href: '/admin/customers',
        icon: Users,
        badge: 'live',
        children: [
          {
            title: 'All Customers',
            href: '/admin/customers',
            icon: Users,
          },
          {
            title: 'Segments',
            href: '/admin/customers/segments',
            icon: Target,
          },
          {
            title: 'Export',
            href: '/admin/customers/export',
            icon: FileText,
          },
        ],
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
            title: 'Revenue',
            href: '/admin/analytics/revenue',
            icon: DollarSign,
          },
          {
            title: 'Acquisition',
            href: '/admin/analytics/acquisition',
            icon: TrendingUp,
          },
          {
            title: 'Retention',
            href: '/admin/analytics/retention',
            icon: Target,
          },
          {
            title: 'LTV Analysis',
            href: '/admin/analytics/ltv',
            icon: DollarSign,
          },
          {
            title: 'Funnel',
            href: '/admin/analytics/funnel',
            icon: BarChart3,
          },
          {
            title: 'Advanced',
            href: '/admin/analytics/advanced',
            icon: BarChart3,
          },
        ],
      },
    ],
  },
  {
    title: 'Marketing',
    items: [
      {
        title: 'Email Marketing',
        href: '/admin/marketing',
        icon: Mail,
        children: [
          {
            title: 'Campaigns',
            href: '/admin/marketing/campaigns',
            icon: Mail,
          },
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
            title: 'Analytics',
            href: '/admin/marketing/analytics',
            icon: BarChart3,
          },
        ],
      },
      {
        title: 'Ads Manager',
        href: '/admin/ads',
        icon: Megaphone,
        children: [
          {
            title: 'Overview',
            href: '/admin/ads',
            icon: LayoutDashboard,
          },
          {
            title: 'Meta Ads',
            href: '/admin/ads/meta',
            icon: Megaphone,
          },
          {
            title: 'Google Ads',
            href: '/admin/ads/google',
            icon: Megaphone,
          },
          {
            title: 'TikTok Ads',
            href: '/admin/ads/tiktok',
            icon: Megaphone,
          },
          {
            title: 'Attribution',
            href: '/admin/ads/attribution',
            icon: Target,
          },
          {
            title: 'ROI',
            href: '/admin/ads/roi',
            icon: DollarSign,
          },
        ],
      },
    ],
  },
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
        title: 'Integrations',
        href: '/admin/integrations',
        icon: Zap,
      },
      {
        title: 'Settings',
        href: '/admin/settings',
        icon: Settings,
        children: [
          {
            title: 'General',
            href: '/admin/settings',
            icon: Settings,
          },
          {
            title: 'Security',
            href: '/admin/settings/security',
            icon: Shield,
          },
          {
            title: 'Notifications',
            href: '/admin/settings/notifications',
            icon: Bell,
          },
        ],
      },
    ],
  },
];
