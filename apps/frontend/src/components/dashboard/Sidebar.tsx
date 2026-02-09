'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useDensity } from '@/providers/DensityProvider';
import { sidebarConfig } from '@/styles/dashboard-tokens';
import { 
  LayoutDashboard, 
  Palette, 
  Globe,
  BarChart3, 
  Package, 
  CreditCard, 
  Users, 
  Plug, 
  Settings,
  Bell,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  Box,
  Camera,
  Layers,
  FileText,
  Crown,
  BookOpen,
  MessageSquare,
  Database,
  Eye,
  Activity,
  Library,
  Upload,
  LayoutTemplate,
  Store,
  Coins,
  FlaskConical,
  TrendingUp,
  Edit,
  Video,
  Shield,
  Webhook,
  Gem,
  Glasses,
  Shirt,
  Printer,
  Sofa,
  Sparkles,
  Gift,
  Trophy,
  LayoutGrid
} from 'lucide-react';
import { useFeatureFlag } from '@/contexts/FeatureFlagContext';
import { useIndustryStore, type IndustryModuleConfig } from '@/store/industry.store';
import { useDashboardStore } from '@/store/dashboard.store';
import { useSubscription } from '@/lib/hooks/api/useSubscription';
import type { PlanTier } from '@/lib/hooks/api/useSubscription';

// Map industry icon names to Lucide components
const INDUSTRY_ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  gem: Gem, glasses: Glasses, shirt: Shirt, printer: Printer,
  sofa: Sofa, sparkles: Sparkles, gift: Gift, trophy: Trophy,
  'layout-grid': LayoutGrid,
};

// Map module slugs to their navigation config
const MODULE_NAV_MAP: Record<string, { section: string; itemName: string }> = {
  'ai-studio': { section: 'Création', itemName: 'AI Studio' },
  'ar-studio': { section: 'Création', itemName: 'AR Studio' },
  'editor-2d': { section: 'Création', itemName: 'Éditeur' },
  'configurator-3d': { section: 'Création', itemName: 'Configurateur 3D' },
  'products': { section: 'Gestion', itemName: 'Produits' },
  'orders': { section: 'Gestion', itemName: 'Commandes' },
  'analytics': { section: 'Gestion', itemName: 'Analytics' },
  'marketplace': { section: 'Gestion', itemName: 'Seller' },
};

const PLAN_HIERARCHY: Record<PlanTier, number> = {
  free: 0,
  starter: 1,
  professional: 2,
  business: 3,
  enterprise: 4,
};

/** Plan badge label for sidebar (PRO, BUSINESS, etc.) */
function planBadgeLabel(plan: PlanTier): string {
  return plan === 'professional' ? 'PRO' : plan === 'business' ? 'BUSINESS' : plan === 'enterprise' ? 'ENTERPRISE' : plan.toUpperCase();
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  description: string;
  badge?: string;
  children?: NavItem[];
  moduleSlug?: string;
  minimumPlan?: PlanTier;
  priority?: 'PRIMARY' | 'SECONDARY' | 'AVAILABLE' | 'HIDDEN';
  sortOrder?: number;
}

const navigationSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Création',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Tableau de bord principal'
      },
      {
        name: 'AI Studio',
        href: '/dashboard/ai-studio',
        icon: Palette,
        description: 'Création avec IA',
        badge: 'Pro',
        moduleSlug: 'ai-studio',
        minimumPlan: 'professional',
        children: [
          { name: 'Générateur 2D', href: '/dashboard/ai-studio/2d', icon: Palette, description: 'Designs 2D' },
          { name: 'Modèles 3D', href: '/dashboard/ai-studio/3d', icon: Box, description: 'Objets 3D' },
          { name: 'Animations', href: '/dashboard/ai-studio/animations', icon: Video, description: 'Animations IA' },
          { name: 'Templates', href: '/dashboard/ai-studio/templates', icon: Layers, description: 'Modèles prêts' }
        ]
      },
      {
        name: 'AR Studio',
        href: '/dashboard/ar-studio',
        icon: Globe,
        description: 'Réalité augmentée',
        badge: 'Pro',
        moduleSlug: 'ar-studio',
        minimumPlan: 'professional',
        children: [
          { name: 'Prévisualisation AR', href: '/dashboard/ar-studio/preview', icon: Eye, description: 'Voir en AR' },
          { name: 'Collaboration AR', href: '/dashboard/ar-studio/collaboration', icon: Users, description: 'Travail d\'équipe' },
          { name: 'Bibliothèque 3D', href: '/dashboard/ar-studio/library', icon: Database, description: 'Modèles 3D' },
          { name: 'Intégrations AR', href: '/dashboard/ar-studio/integrations', icon: Plug, description: 'Connexions' }
        ]
      },
      {
        name: 'Éditeur',
        href: '/dashboard/editor',
        icon: Edit,
        description: 'Éditeur de design',
        badge: 'Pro',
        moduleSlug: 'editor-2d',
      },
      {
        name: 'Configurateur 3D',
        href: '/dashboard/configurator-3d',
        icon: Box,
        description: 'Personnalisation 3D',
        badge: 'Pro',
        moduleSlug: 'configurator-3d',
        minimumPlan: 'professional',
      },
      {
        name: 'Bibliothèque',
        href: '/dashboard/library',
        icon: Library,
        description: 'Assets et templates',
        children: [
          { name: 'Bibliothèque', href: '/dashboard/library', icon: Library, description: 'Tous les assets' },
          { name: 'Import', href: '/dashboard/library/import', icon: Upload, description: 'Importer des fichiers' },
          { name: 'Templates', href: '/dashboard/templates', icon: LayoutTemplate, description: 'Modèles prêts' }
        ]
      }
    ]
  },
  {
    title: 'Gestion',
    items: [
      {
        name: 'Produits',
        href: '/dashboard/products',
        icon: Package,
        description: 'Catalogue produits',
        moduleSlug: 'products',
      },
      {
        name: 'Commandes',
        href: '/dashboard/orders',
        icon: FileText,
        description: 'Gestion des commandes',
        moduleSlug: 'orders',
      },
      {
        name: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
        description: 'Métriques et statistiques',
        moduleSlug: 'analytics',
        minimumPlan: 'business',
        children: [
          { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, description: 'Métriques principales' },
          { name: 'Analytics Avancées', href: '/dashboard/analytics-advanced', icon: TrendingUp, description: 'Analyses approfondies' },
          { name: 'A/B Testing', href: '/dashboard/ab-testing', icon: FlaskConical, description: 'Tests d\'optimisation' }
        ]
      },
      {
        name: 'Webhooks',
        href: '/dashboard/webhooks',
        icon: Webhook,
        description: 'Gestion des webhooks',
      },
      {
        name: 'Seller',
        href: '/dashboard/seller',
        icon: Store,
        description: 'Dashboard vendeur',
        badge: 'Pro',
        moduleSlug: 'marketplace',
      },
      {
        name: 'Monitoring temps réel',
        href: '/dashboard/monitoring',
        icon: Activity,
        description: 'Observabilité et files BullMQ',
        badge: 'Live'
      }
    ]
  },
  {
    title: 'Entreprise',
    items: [
      {
        name: 'Équipe',
        href: '/dashboard/team',
        icon: Users,
        description: 'Collaboration'
      },
      {
        name: 'Facturation',
        href: '/dashboard/billing',
        icon: CreditCard,
        description: 'Abonnements',
        children: [
          { name: 'Facturation', href: '/dashboard/billing', icon: CreditCard, description: 'Plans et abonnements' },
          { name: 'Portail Stripe', href: '/dashboard/billing/portal', icon: CreditCard, description: 'Gestion Stripe' }
        ]
      },
      {
        name: 'Crédits',
        href: '/dashboard/credits',
        icon: Coins,
        description: 'Gestion des crédits'
      },
      {
        name: 'Intégrations',
        href: '/dashboard/integrations-dashboard',
        icon: Plug,
        description: 'API et connecteurs',
        minimumPlan: 'business',
      },
      {
        name: 'Sécurité',
        href: '/dashboard/security',
        icon: Shield,
        description: 'Paramètres de sécurité'
      },
      {
        name: 'Paramètres',
        href: '/dashboard/settings',
        icon: Settings,
        description: 'Configuration'
      }
    ]
  },
  {
    title: 'Plus',
    items: [
      {
        name: 'Notifications',
        href: '/dashboard/notifications',
        icon: Bell,
        description: 'Alertes et messages'
      },
      {
        name: 'Parrainage',
        href: '/dashboard/affiliate',
        icon: Users,
        description: 'Programme d\'affiliation',
        badge: 'Nouveau'
      },
      {
        name: 'Support',
        href: '/dashboard/support',
        icon: MessageSquare,
        description: 'Tickets et assistance'
      },
      {
        name: 'Documentation',
        href: '/help/documentation',
        icon: BookOpen,
        description: 'Guides et tutoriels'
      }
    ]
  }
];

/**
 * Hook that sorts and filters navigation items based on industry module config.
 * PRIMARY modules are shown first, then SECONDARY, then AVAILABLE.
 * HIDDEN modules are filtered out.
 */
function useAdaptiveSections() {
  const { industryConfig, currentIndustry } = useIndustryStore();
  const { userPreferences } = useDashboardStore();

  return useMemo(() => {
    if (!industryConfig?.modules || industryConfig.modules.length === 0) {
      // No industry config — return default navigation
      return navigationSections;
    }

    // Create a map of moduleSlug -> config for quick lookup
    const moduleMap = new Map<string, IndustryModuleConfig>();
    for (const m of industryConfig.modules) {
      moduleMap.set(m.moduleSlug, m);
    }

    // Apply user sidebar order override if available
    const userSidebarOrder = userPreferences?.sidebarOrder ?? null;

    return navigationSections.map((section) => {
      const sortedItems = section.items
        .map((item) => {
          if (!item.moduleSlug) return { ...item, priority: 'PRIMARY' as const, sortOrder: -1 };
          const config = moduleMap.get(item.moduleSlug);
          if (!config) return { ...item, priority: 'AVAILABLE' as const, sortOrder: 999 };
          return {
            ...item,
            priority: config.priority,
            sortOrder: config.sortOrder,
          };
        })
        .filter((item) => item.priority !== 'HIDDEN')
        .sort((a, b) => {
          // User override takes top priority
          if (userSidebarOrder) {
            const aIdx = userSidebarOrder.indexOf(a.moduleSlug ?? a.name);
            const bIdx = userSidebarOrder.indexOf(b.moduleSlug ?? b.name);
            if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
            if (aIdx !== -1) return -1;
            if (bIdx !== -1) return 1;
          }
          // Then by priority: PRIMARY < SECONDARY < AVAILABLE
          const priorityOrder = { PRIMARY: 0, SECONDARY: 1, AVAILABLE: 2, HIDDEN: 3 };
          const pA = priorityOrder[a.priority ?? 'AVAILABLE'];
          const pB = priorityOrder[b.priority ?? 'AVAILABLE'];
          if (pA !== pB) return pA - pB;
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        });

      return { ...section, items: sortedItems };
    });
  }, [industryConfig, userPreferences]);
}

function SidebarIndustryBadge({ isCollapsed }: { isCollapsed: boolean }) {
  const { currentIndustry } = useIndustryStore();

  if (!currentIndustry) return null;

  const IconComponent = INDUSTRY_ICON_MAP[currentIndustry.icon] || LayoutGrid;

  if (isCollapsed) {
    return (
      <div className="flex justify-center py-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${currentIndustry.accentColor}25` }}
        >
          <IconComponent className="w-4 h-4" style={{ color: currentIndustry.accentColor }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-4 mb-2 px-3 py-2 rounded-lg flex items-center gap-2"
      style={{ backgroundColor: `${currentIndustry.accentColor}12` }}
    >
      <IconComponent className="w-4 h-4" style={{ color: currentIndustry.accentColor }} />
      <span className="text-xs font-medium" style={{ color: currentIndustry.accentColor }}>
        {currentIndustry.labelFr}
      </span>
    </div>
  );
}

function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useDensity();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const monitoringEnabled = useFeatureFlag('realtime_monitoring', true);
  const adaptiveSections = useAdaptiveSections();
  const { data: subscription } = useSubscription();

  const hasMinimumPlan = (minimumPlan: PlanTier): boolean => {
    if (!subscription) return true;
    const userLevel = PLAN_HIERARCHY[subscription.plan] ?? 0;
    const requiredLevel = PLAN_HIERARCHY[minimumPlan] ?? 0;
    return userLevel >= requiredLevel;
  };

  const toggleExpanded = useCallback((itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed);
  }, [sidebarCollapsed, setSidebarCollapsed]);

  const isItemActive = (item: NavItem) => {
    if (item.href === pathname) return true;
    if (item.children) {
      return item.children.some(child => child.href === pathname);
    }
    return false;
  };

  return (
    <motion
      initial={false}
      animate={{ width: sidebarCollapsed ? sidebarConfig.collapsedWidth : sidebarConfig.expandedWidth }}
      transition={{ duration: sidebarConfig.transitionDuration / 1000 }}
      className="dash-sidebar dash-scroll flex flex-col h-screen sticky top-0"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Luneo</h1>
                <p className="text-xs text-white/40">Creative Studio</p>
              </div>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">L</span>
              </div>
            </Link>
          )}

          <button
            onClick={handleToggleCollapse}
            className="p-2 hover:bg-white/[0.04] rounded-lg transition-colors text-white/50"
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Search */}
      {!sidebarCollapsed && (
        <div className="p-4 border-b border-white/[0.06]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="dash-input w-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Industry Badge */}
      <SidebarIndustryBadge isCollapsed={sidebarCollapsed} />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {adaptiveSections.map((section) => (
          <div key={section.title} className="mb-6">
            {!sidebarCollapsed && (
              <h3 className="px-4 text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                if (item.href === '/monitoring' && !monitoringEnabled) {
                  return null;
                }

                const isActive = isItemActive(item);
                const isExpanded = expandedItems.includes(item.name);
                const Icon = item.icon;
                const requiredPlan = item.minimumPlan;
                const hasAccess = requiredPlan ? hasMinimumPlan(requiredPlan) : true;
                const showPlanBadge = requiredPlan && !sidebarCollapsed;
                const planBadge = showPlanBadge ? planBadgeLabel(requiredPlan) : null;

                return (
                  <div key={item.name} className={requiredPlan && !hasAccess ? 'opacity-60' : undefined}>
                    {/* Main Item */}
                    <div
                      className={`mx-2 rounded-lg transition-all duration-200 border ${
                        isActive ? 'dash-sidebar-item-active' : 'border-transparent hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          className="flex-1 flex items-center px-3 py-3 text-sm font-medium transition-colors text-white"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                            isActive
                              ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400'
                              : 'bg-white/[0.06] text-white/60'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {!sidebarCollapsed && (
                            <>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span>{item.name}</span>
                                  {planBadge ? (
                                    <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                                      requiredPlan === 'professional'
                                        ? 'bg-purple-500/20 text-purple-400'
                                        : requiredPlan === 'business'
                                          ? 'bg-amber-500/20 text-amber-400'
                                          : 'bg-white/10 text-white/70'
                                    }`}>
                                      {planBadge}
                                    </span>
                                  ) : item.badge ? (
                                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full dash-badge ${
                                      item.badge === 'Pro' ? 'dash-badge-pro' :
                                      item.badge === 'Enterprise' ? 'dash-badge-enterprise' :
                                      item.badge === 'Live' ? 'dash-badge-live' :
                                      'dash-badge-new'
                                    }`}>
                                      {item.badge}
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-xs text-white/50 mt-0.5">{item.description}</p>
                              </div>
                            </>
                          )}
                        </Link>

                        {!sidebarCollapsed && item.children && (
                          <button
                            onClick={() => toggleExpanded(item.name)}
                            className="p-2 hover:bg-white/[0.04] rounded-lg transition-colors text-white/50"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sub Items */}
                    {!sidebarCollapsed && item.children && (
                      <AnimatePresence>
                        {isExpanded && (
                          <motion
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="ml-6 mt-1 space-y-1"
                          >
                            {item.children.map((child) => {
                              const isChildActive = child.href === pathname;
                              const ChildIcon = child.icon;

                              return (
                                <Link
                                  key={child.name}
                                  href={child.href}
                                  className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                                    isChildActive
                                      ? 'bg-white/[0.06] text-white border border-purple-500/20'
                                      : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                                  }`}
                                >
                                  <ChildIcon className="w-4 h-4 mr-3" />
                                  <div>
                                    <div>{child.name}</div>
                                    <p className="text-xs text-white/30">{child.description}</p>
                                  </div>
                                </Link>
                              );
                            })}
                          </motion>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Section */}
      <div className="border-t border-white/[0.06] p-4">
        {!sidebarCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">EA</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <span className="text-sm font-medium text-white">Emmanuel A.</span>
                <Crown className="w-4 h-4 ml-1 text-yellow-500" />
              </div>
              <p className="text-xs text-white/40">Enterprise Plan</p>
            </div>
            <button className="p-2 hover:bg-white/[0.04] rounded-lg transition-colors">
              <Bell className="w-4 h-4 text-white/40" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">EA</span>
            </div>
            <button className="p-2 hover:bg-white/[0.04] rounded-lg transition-colors">
              <Bell className="w-4 h-4 text-white/40" />
            </button>
          </div>
        )}
      </div>
    </motion>
  );
}

// Optimisation avec React.memo pour éviter les re-renders inutiles
const SidebarMemo = memo(Sidebar);

export default function SidebarWithErrorBoundary() {
  return (
    <ErrorBoundary componentName="Sidebar">
      <SidebarMemo />
    </ErrorBoundary>
  );
}
