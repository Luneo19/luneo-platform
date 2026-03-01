'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LazyMotionDiv as Motion } from '@/lib/performance/dynamic-motion';
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
  Menu,
  X
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Logo } from '@/components/Logo';
import { appRoutes } from '@/lib/routes';

const navigationItems = [
  {
    name: 'Dashboard',
    href: appRoutes.overview,
    icon: LayoutDashboard,
    description: 'Vue d\'ensemble'
  },
  {
    name: 'AI Studio',
    href: appRoutes.agents,
    icon: Palette,
    description: 'Créer des designs'
  },
  {
    name: 'AR Studio',
    href: appRoutes.agents,
    icon: Globe,
    description: 'Réalité augmentée'
  },
  {
    name: 'Analytics',
    href: appRoutes.analytics,
    icon: BarChart3,
    description: 'Métriques et statistiques'
  },
  {
    name: 'Produits',
    href: appRoutes.agents,
    icon: Package,
    description: 'Gérer vos produits'
  },
  {
    name: 'Facturation',
    href: appRoutes.billing,
    icon: CreditCard,
    description: 'Abonnements et paiements'
  },
  {
    name: 'Équipe',
    href: appRoutes.team,
    icon: Users,
    description: 'Collaboration et membres'
  },
  {
    name: 'Intégrations',
    href: appRoutes.integrations,
    icon: Plug,
    description: 'API et connecteurs'
  },
  {
    name: 'Paramètres',
    href: appRoutes.settings,
    icon: Settings,
    description: 'Configuration du compte'
  }
];

function DashboardNavContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const userInitials = user
    ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'
    : '?';

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const navigationItemsMemo = useMemo(() => navigationItems, []);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo href="/overview" size="default" showText={true} variant="light" />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItemsMemo.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="hidden xl:inline">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side - Search, Notifications, User */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:block">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
              <Bell className="w-5 h-5" />
            </button>

            {/* User Avatar */}
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">{userInitials}</span>
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              onClick={toggleMenu}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <Motion
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden border-t border-gray-200 py-4"
          >
            <div className="space-y-2">
              {navigationItemsMemo.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={closeMenu}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    <div>
                      <div>{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Motion>
        )}
      </div>
    </nav>
  );
}

const DashboardNavContentMemo = memo(DashboardNavContent);

export function DashboardNav() {
  return (
    <ErrorBoundary componentName="DashboardNav">
      <DashboardNavContentMemo />
    </ErrorBoundary>
  );
}
