'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Activity
} from 'lucide-react';
import { useFeatureFlag } from '@/contexts/FeatureFlagContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  description: string;
  badge?: string;
  children?: NavItem[];
}

const navigationSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Création',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard/overview',
        icon: LayoutDashboard,
        description: 'Vue d\'ensemble'
      },
      {
        name: 'AI Studio',
        href: '/dashboard/ai-studio',
        icon: Palette,
        description: 'Création avec IA',
        badge: 'Pro',
        children: [
          { name: 'Générateur 2D', href: '/dashboard/ai-studio/2d', icon: Palette, description: 'Designs 2D' },
          { name: 'Modèles 3D', href: '/dashboard/ai-studio/3d', icon: Box, description: 'Objets 3D' },
          { name: 'Animations', href: '/dashboard/ai-studio/animations', icon: Camera, description: 'Animations' },
          { name: 'Templates', href: '/dashboard/ai-studio/templates', icon: Layers, description: 'Modèles prêts' }
        ]
      },
      {
        name: 'AR Studio',
        href: '/dashboard/ar-studio',
        icon: Globe,
        description: 'Réalité augmentée',
        badge: 'Enterprise',
        children: [
          { name: 'Prévisualisation AR', href: '/dashboard/ar-studio/preview', icon: Eye, description: 'Voir en AR' },
          { name: 'Collaboration AR', href: '/dashboard/ar-studio/collaboration', icon: Users, description: 'Travail d\'équipe' },
          { name: 'Bibliothèque 3D', href: '/dashboard/ar-studio/library', icon: Database, description: 'Modèles 3D' },
          { name: 'Intégrations AR', href: '/dashboard/ar-studio/integrations', icon: Plug, description: 'Connexions' }
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
        description: 'Catalogue produits'
      },
      {
        name: 'Commandes',
        href: '/dashboard/orders',
        icon: FileText,
        description: 'Gestion des commandes'
      },
      {
        name: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
        description: 'Métriques et statistiques'
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
        description: 'Abonnements'
      },
      {
        name: 'Intégrations',
        href: '/dashboard/integrations-dashboard',
        icon: Plug,
        description: 'API et connecteurs'
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
        href: '/dashboard/referral',
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

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const monitoringEnabled = useFeatureFlag('realtime_monitoring', true);

  const toggleExpanded = useCallback((itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const isItemActive = (item: NavItem) => {
    if (item.href === pathname) return true;
    if (item.children) {
      return item.children.some(child => child.href === pathname);
    }
    return false;
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className={`bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-70'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <Link href="/dashboard/overview" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Luneo</h1>
                <p className="text-xs text-gray-500">Creative Studio</p>
              </div>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/dashboard/overview" className="flex items-center justify-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">L</span>
              </div>
            </Link>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {navigationSections.map((section) => (
          <div key={section.title} className="mb-6">
            {!isCollapsed && (
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
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

                return (
                  <div key={item.name}>
                    {/* Main Item */}
                    <div
                      className={`mx-2 rounded-lg transition-all duration-200 ${
                        isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          className={`flex-1 flex items-center px-3 py-3 text-sm font-medium transition-colors ${
                            isActive ? 'text-blue-700' : 'text-gray-700 hover:text-gray-900'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                            isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {!isCollapsed && (
                            <>
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <span>{item.name}</span>
                                  {item.badge && (
                                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                      item.badge === 'Pro' ? 'bg-purple-100 text-purple-700' :
                                      item.badge === 'Enterprise' ? 'bg-orange-100 text-orange-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                              </div>
                            </>
                          )}
                        </Link>
                        
                        {!isCollapsed && item.children && (
                          <button
                            onClick={() => toggleExpanded(item.name)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sub Items */}
                    {!isCollapsed && item.children && (
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
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
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                  }`}
                                >
                                  <ChildIcon className="w-4 h-4 mr-3" />
                                  <div>
                                    <div>{child.name}</div>
                                    <p className="text-xs text-gray-500">{child.description}</p>
                                  </div>
                                </Link>
                              );
                            })}
                          </motion.div>
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
      <div className="border-t border-gray-200 p-4">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">EA</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900">Emmanuel A.</span>
                <Crown className="w-4 h-4 ml-1 text-yellow-500" />
              </div>
              <p className="text-xs text-gray-500">Enterprise Plan</p>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">EA</span>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Optimisation avec React.memo pour éviter les re-renders inutiles
export default memo(Sidebar);
