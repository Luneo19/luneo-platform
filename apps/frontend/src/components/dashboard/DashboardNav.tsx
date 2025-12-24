'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Vue d\'ensemble'
  },
  {
    name: 'AI Studio',
    href: '/ai-studio',
    icon: Palette,
    description: 'Créer des designs'
  },
  {
    name: 'AR Studio',
    href: '/ar-studio',
    icon: Globe,
    description: 'Réalité augmentée'
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Métriques et statistiques'
  },
  {
    name: 'Produits',
    href: '/products',
    icon: Package,
    description: 'Gérer vos produits'
  },
  {
    name: 'Facturation',
    href: '/billing',
    icon: CreditCard,
    description: 'Abonnements et paiements'
  },
  {
    name: 'Équipe',
    href: '/team',
    icon: Users,
    description: 'Collaboration et membres'
  },
  {
    name: 'Intégrations',
    href: '/integrations',
    icon: Plug,
    description: 'API et connecteurs'
  },
  {
    name: 'Paramètres',
    href: '/settings',
    icon: Settings,
    description: 'Configuration du compte'
  }
];

function DashboardNavContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

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
              <span className="text-white font-medium text-sm">JD</span>
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
          <motion.div
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
          </motion.div>
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
