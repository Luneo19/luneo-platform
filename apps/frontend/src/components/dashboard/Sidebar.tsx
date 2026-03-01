'use client';

import React, { useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LazyMotionDiv as Motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useDensity } from '@/providers/DensityProvider';
import { sidebarConfig } from '@/styles/dashboard-tokens';
import { useI18n } from '@/i18n/useI18n';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  BookOpen,
  BarChart3,
  Plug,
  CreditCard,
  Settings,
  Users,
  HelpCircle,
  Bell,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  Shield,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
  children?: NavItem[];
}

const navigationSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: '',
    items: [
      {
        name: 'Overview',
        href: '/overview',
        icon: LayoutDashboard,
        description: 'Vue d\'ensemble de la plateforme',
      },
      {
        name: 'Agents',
        href: '/agents',
        icon: Bot,
        description: 'Gérer vos agents IA',
      },
      {
        name: 'Conversations',
        href: '/conversations',
        icon: MessageSquare,
        description: 'Historique des conversations',
      },
      {
        name: 'Knowledge',
        href: '/knowledge',
        icon: BookOpen,
        description: 'Base de connaissances',
        badge: 'Bientôt',
      },
      {
        name: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        description: 'Performance et statistiques',
      },
      {
        name: 'Intégrations',
        href: '/integrations',
        icon: Plug,
        description: 'Connexions et canaux',
      },
    ],
  },
  {
    title: 'Gestion',
    items: [
      {
        name: 'Facturation',
        href: '/billing',
        icon: CreditCard,
        description: 'Plans et abonnements',
      },
      {
        name: 'Paramètres',
        href: '/settings',
        icon: Settings,
        description: 'Configuration du compte',
      },
      {
        name: 'Équipe',
        href: '/team',
        icon: Users,
        description: 'Membres et rôles',
      },
      {
        name: 'Support',
        href: '/support',
        icon: HelpCircle,
        description: 'Aide et assistance',
      },
    ],
  },
];

const SIDEBAR_SECTION_KEYS: Record<string, string> = {
  'Gestion': 'dashboard.sidebar.sections.management',
};

const SIDEBAR_ITEM_KEYS: Record<string, string> = {
  '/overview': 'dashboard.sidebar.overview',
  '/agents': 'dashboard.sidebar.agents',
  '/conversations': 'dashboard.sidebar.conversations',
  '/knowledge': 'dashboard.sidebar.knowledge',
  '/analytics': 'dashboard.sidebar.analytics',
  '/integrations': 'dashboard.sidebar.integrations',
  '/billing': 'dashboard.sidebar.billing',
  '/settings': 'dashboard.sidebar.settings',
  '/team': 'dashboard.sidebar.team',
  '/support': 'dashboard.sidebar.support',
};

const SIDEBAR_ITEM_DESC_KEYS: Record<string, string> = {
  '/overview': 'dashboard.sidebar.overviewDesc',
  '/agents': 'dashboard.sidebar.agentsDesc',
  '/conversations': 'dashboard.sidebar.conversationsDesc',
  '/knowledge': 'dashboard.sidebar.knowledgeDesc',
  '/analytics': 'dashboard.sidebar.analyticsDesc',
  '/integrations': 'dashboard.sidebar.integrationsDesc',
  '/billing': 'dashboard.sidebar.billingDesc',
  '/settings': 'dashboard.sidebar.settingsDesc',
  '/team': 'dashboard.sidebar.teamDesc',
  '/support': 'dashboard.sidebar.supportDesc',
};

interface SidebarProps {
  onClose?: () => void;
}

function Sidebar({ onClose }: SidebarProps = {}) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { sidebarCollapsed, setSidebarCollapsed } = useDensity();
  const userDisplayName = user ? `${user.firstName || ''} ${user.lastName?.[0] || ''}`.trim() || user.email : '';
  const userInitials = user
    ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'
    : '?';
  const isMobileOverlay = Boolean(onClose);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleExpanded = useCallback((itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  }, []);

  const handleToggleCollapse = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  }, [sidebarCollapsed, setSidebarCollapsed, onClose]);

  const isItemActive = (item: NavItem) => {
    if (item.href === pathname) return true;
    if (item.href !== '/overview' && pathname?.startsWith(item.href)) return true;
    if (item.children) {
      return item.children.some(child => child.href === pathname);
    }
    return false;
  };

  const handleNavClick = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const effectiveCollapsed = isMobileOverlay ? false : sidebarCollapsed;

  return (
    <Motion
      initial={false}
      animate={{ width: effectiveCollapsed ? sidebarConfig.collapsedWidth : sidebarConfig.expandedWidth }}
      transition={{ duration: sidebarConfig.transitionDuration / 1000 }}
      className="dash-sidebar dash-scroll flex flex-col h-screen sticky top-0 text-foreground"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!effectiveCollapsed && (
            <Link href="/overview" className="flex items-center space-x-3" onClick={handleNavClick}>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Luneo</h1>
                <p className="text-xs text-muted-foreground">Agent IA</p>
              </div>
            </Link>
          )}
          {effectiveCollapsed && (
            <Link href="/overview" className="flex items-center justify-center" onClick={handleNavClick}>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">L</span>
              </div>
            </Link>
          )}

          <button
            onClick={handleToggleCollapse}
            className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground"
            aria-label={isMobileOverlay ? t('dashboard.sidebar.closeMenu') : (effectiveCollapsed ? t('dashboard.sidebar.openSidebar') : t('dashboard.sidebar.collapseSidebar'))}
          >
            {isMobileOverlay || !effectiveCollapsed ? <X className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Search */}
      {!effectiveCollapsed && (
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('dashboard.sidebar.searchPlaceholder')}
              className="dash-input w-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-transparent"
              aria-label={t('dashboard.sidebar.searchPlaceholder')}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {navigationSections.map((section) => (
          <div key={section.title || '_main'} className="mb-6">
            {section.title && (
              <div className="mx-4 mb-3 border-t border-border" />
            )}
            {!effectiveCollapsed && section.title && (
              <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {SIDEBAR_SECTION_KEYS[section.title] ? t(SIDEBAR_SECTION_KEYS[section.title]) : section.title}
              </h3>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = isItemActive(item);
                const isExpanded = expandedItems.includes(item.name);
                const Icon = item.icon;

                return (
                  <div key={item.name}>
                    <div
                      className={`mx-2 rounded-lg transition-all duration-200 border ${
                        isActive ? 'dash-sidebar-item-active' : 'border-transparent hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          className="flex-1 flex items-center px-3 py-3 text-sm font-medium transition-colors text-foreground"
                          onClick={handleNavClick}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                            isActive
                              ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {!effectiveCollapsed && (
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span>{SIDEBAR_ITEM_KEYS[item.href] ? t(SIDEBAR_ITEM_KEYS[item.href]) : item.name}</span>
                                {item.badge && (
                                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full dash-badge dash-badge-new">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{SIDEBAR_ITEM_DESC_KEYS[item.href] ? t(SIDEBAR_ITEM_DESC_KEYS[item.href]) : item.description}</p>
                            </div>
                          )}
                        </Link>

                        {!effectiveCollapsed && item.children && (
                          <button
                            onClick={() => toggleExpanded(item.name)}
                            className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground"
                            aria-label={isExpanded ? t('dashboard.sidebar.collapseSection') : t('dashboard.sidebar.expandSection')}
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
                    {!effectiveCollapsed && item.children && (
                      <AnimatePresence>
                        {isExpanded && (
                          <Motion
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
                                  onClick={handleNavClick}
                                  className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                                    isChildActive
                                      ? 'bg-accent text-foreground border border-purple-500/20'
                                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                  }`}
                                >
                                  <ChildIcon className="w-4 h-4 mr-3" />
                                  <div>
                                    <div>{child.name}</div>
                                    <p className="text-xs text-muted-foreground">{child.description}</p>
                                  </div>
                                </Link>
                              );
                            })}
                          </Motion>
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

      {/* Documentation link */}
      <div className="border-t border-border px-2 py-2">
        <div className={`flex ${effectiveCollapsed ? 'flex-col items-center gap-1' : 'items-center gap-1'}`}>
          <Link
            href="/help/documentation"
            onClick={handleNavClick}
            className="flex items-center px-3 py-2 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {!effectiveCollapsed && <span className="ml-2">{t('dashboard.sidebar.documentation')}</span>}
          </Link>
        </div>
      </div>

      {/* Admin Panel Link — visible only for PLATFORM_ADMIN */}
      {user?.role === 'PLATFORM_ADMIN' && (
        <div className="border-t border-border px-2 py-3">
          <Link
            href="/admin"
            onClick={handleNavClick}
            className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 border ${
              pathname?.startsWith('/admin')
                ? 'dash-sidebar-item-active'
                : 'border-transparent hover:bg-accent'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              effectiveCollapsed ? '' : 'mr-3'
            } ${
              pathname?.startsWith('/admin')
                ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 text-red-400'
                : 'bg-gradient-to-br from-red-500/10 to-orange-500/10 text-red-400/70'
            }`}>
              <Shield className="w-4 h-4" />
            </div>
            {!effectiveCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-red-400">{t('dashboard.sidebar.adminPanel')}</span>
                  <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 shrink-0">
                    Admin
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{t('dashboard.sidebar.adminPanelDescription')}</p>
              </div>
            )}
          </Link>
        </div>
      )}

      {/* User Section */}
      <div className="border-t border-border p-4">
        {!effectiveCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">{userInitials}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <span className="text-sm font-medium text-foreground">{userDisplayName}</span>
              </div>
              <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
            </div>
            <button className="p-2 hover:bg-accent rounded-lg transition-colors" aria-label={t('dashboard.sidebar.notifications') || 'Notifications'}>
              <Bell className="w-4 h-4 text-muted-foreground" aria-hidden />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">{userInitials}</span>
            </div>
            <button className="p-2 hover:bg-accent rounded-lg transition-colors" aria-label={t('dashboard.sidebar.notifications') || 'Notifications'}>
              <Bell className="w-4 h-4 text-muted-foreground" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </Motion>
  );
}

const SidebarMemo = memo(Sidebar);

export default function SidebarWithErrorBoundary(props: SidebarProps) {
  return (
    <ErrorBoundary componentName="Sidebar">
      <SidebarMemo {...props} />
    </ErrorBoundary>
  );
}
