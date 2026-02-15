'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { 
  LayoutDashboard, 
  Palette, 
  BarChart3, 
  Package, 
  CreditCard, 
  Settings, 
  Users, 
  HelpCircle, 
  Bell,
  ChevronLeft,
  ChevronRight,
  Crown,
  FileText,
  Globe,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

function SidebarContent({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navigationItems = useMemo(() => [
  {
    title: 'Tableau de bord',
    href: '/overview',
    icon: LayoutDashboard,
    badge: null,
    description: 'Vue d\'ensemble de votre activité'
  },
  {
    title: 'AI Studio',
    href: '/dashboard/ai-studio',
    icon: Palette,
    badge: 'Nouveau',
    description: 'Création de designs avec l\'IA'
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    badge: null,
    description: 'Analyses et performances'
  },
  {
    title: 'Produits',
    href: '/dashboard/products',
    icon: Package,
    badge: null,
    description: 'Gestion de vos designs'
  }
], []);

  const businessItems = useMemo(() => [
  {
    title: 'Facturation',
    href: '/dashboard/billing',
    icon: CreditCard,
    badge: null,
    description: 'Gestion des abonnements'
  },
  {
    title: 'Équipe',
    href: '/dashboard/team',
    icon: Users,
    badge: null,
    description: 'Collaboration et permissions'
  },
  {
    title: 'Intégrations',
    href: '/dashboard/integrations-dashboard',
    icon: Globe,
    badge: null,
    description: 'Connexions externes'
  },
  {
    title: 'Sécurité',
    href: '/dashboard/security',
    icon: Shield,
    badge: null,
    description: 'Paramètres de sécurité'
  }
], []);

  const supportItems = useMemo(() => [
  {
    title: 'Aide',
    href: '/help',
    icon: HelpCircle,
    badge: null,
    description: 'Centre d\'aide et support'
  },
  {
    title: 'Documentation',
    href: '/docs',
    icon: FileText,
    badge: null,
    description: 'Guides et API'
  },
  {
    title: 'Statut',
    href: '/status',
    icon: Bell,
    badge: 'OK',
    description: 'État des services'
  }
], []);

  const handleItemHover = useCallback((href: string | null) => {
    setHoveredItem(href);
  }, []);

  interface NavItemType {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: string | null;
    description: string;
  }

  const NavItem = ({ item, showDescription = true }: { item: NavItemType; showDescription?: boolean }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
      <motion
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onMouseEnter={() => handleItemHover(item.href)}
        onMouseLeave={() => handleItemHover(null)}
      >
        <Link
          href={item.href}
          className={cn(
            'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
            isActive
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          )}
        >
          <div className="flex-shrink-0">
            <Icon className={cn(
              'h-5 w-5 transition-colors',
              isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
            )} />
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium truncate">{item.title}</span>
                {item.badge && (
                  <span className={cn(
                    'px-2 py-0.5 text-xs rounded-full font-medium',
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : item.badge === 'Nouveau' 
                        ? 'bg-green-100 text-green-700'
                        : item.badge === 'OK'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                  )}>
                    {item.badge}
                  </span>
                )}
              </div>
              {showDescription && (
                <p className="text-xs text-gray-500 group-hover:text-gray-600 truncate">
                  {item.description}
                </p>
              )}
            </div>
          )}

          {/* Tooltip pour mode collapsed */}
          {isCollapsed && hoveredItem === item.href && (
            <motion
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap"
            >
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-gray-300">{item.description}</div>
            </motion>
          )}
        </Link>
      </motion>
    );
  };

  return (
    <motion
      initial={false}
      animate={{ width: isCollapsed ? '4rem' : '16rem' }}
      className="bg-white border-r border-gray-200 flex flex-col h-full shadow-sm"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <motion
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-3"
            >
              <Logo href="/overview" size="default" showText={false} variant="light" />
              <div>
                <h1 className="font-bold text-gray-900">Luneo</h1>
                <p className="text-xs text-gray-500">Enterprise</p>
              </div>
            </motion>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Plan Status */}
        {!isCollapsed && user && (
          <motion
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Crown className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">
                {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              <Link href="/dashboard/billing" className="text-blue-600 hover:underline">
                Gérer l&apos;abonnement
              </Link>
            </p>
          </motion>
        )}

        {/* Main Navigation */}
        <div className="space-y-2">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Navigation
            </h3>
          )}
          {navigationItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>

        {/* Business Section */}
        <div className="space-y-2">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Business
            </h3>
          )}
          {businessItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>

        {/* Support Section */}
        <div className="space-y-2">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Support
            </h3>
          )}
          {supportItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed ? (
          <div className="space-y-3">
            {/* Settings */}
            <NavItem item={{
              title: 'Paramètres',
              href: '/settings',
              icon: Settings,
              badge: null,
              description: 'Configuration du compte'
            }} showDescription={false} />
          </div>
        ) : (
          <div className="flex justify-center">
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </motion>
  );
}

const SidebarContentMemo = memo(SidebarContent);

export function Sidebar(props: SidebarProps) {
  return (
    <ErrorBoundary componentName="Sidebar">
      <SidebarContentMemo {...props} />
    </ErrorBoundary>
  );
}