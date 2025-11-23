'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  BookOpen, 
  Code, 
  Settings, 
  Shield, 
  Users, 
  Zap,
  FileText,
  Search
} from 'lucide-react';

const sidebarItems = [
  {
    title: 'Documentation',
    icon: <BookOpen className="w-4 h-4" />,
    href: '/help/documentation',
    children: []
  },
  {
    title: 'API Reference',
    icon: <Code className="w-4 h-4" />,
    href: '/help/documentation/api-reference',
    children: [
      { title: 'Authentification', href: '/help/documentation/api-reference/authentication' },
      { title: 'Endpoints principaux', href: '/help/documentation/api-reference/endpoints' },
      { title: 'Créer un design', href: '/help/documentation/api-reference/create-design' },
      { title: 'Créer une commande', href: '/help/documentation/api-reference/create-order' },
      { title: 'Webhooks', href: '/help/documentation/api-reference/webhooks' },
      { title: 'SDK JavaScript', href: '/help/documentation/api-reference/js-sdk' },
      { title: 'Limites et quotas', href: '/help/documentation/api-reference/rate-limits' }
    ]
  },
  {
    title: 'Configuration',
    icon: <Settings className="w-4 h-4" />,
    href: '/help/documentation/configuration',
    children: [
      { title: 'Variables d\'environnement', href: '/help/documentation/configuration/environment-variables' },
      { title: 'Configuration initiale', href: '/help/documentation/configuration/setup' },
      { title: 'Paramètres avancés', href: '/help/documentation/configuration/advanced' },
      { title: 'Monitoring', href: '/help/documentation/configuration/monitoring' }
    ]
  },
  {
    title: 'Sécurité',
    icon: <Shield className="w-4 h-4" />,
    href: '/help/documentation/security',
    children: [
      { title: 'Authentification', href: '/help/documentation/security/authentication' },
      { title: 'SSL/TLS', href: '/help/documentation/security/ssl-tls' },
      { title: 'RGPD', href: '/help/documentation/security/gdpr' },
      { title: 'Bonnes pratiques', href: '/help/documentation/security/best-practices' }
    ]
  },
  {
    title: 'Intégrations',
    icon: <Users className="w-4 h-4" />,
    href: '/help/documentation/integrations',
    children: [
      { title: 'Stripe', href: '/help/documentation/integrations/stripe' },
      { title: 'Slack', href: '/help/documentation/integrations/slack' },
      { title: 'SendGrid', href: '/help/documentation/integrations/sendgrid' },
      { title: 'Shopify', href: '/help/documentation/integrations/shopify' },
      { title: 'GitHub', href: '/help/documentation/integrations/github' },
      { title: 'Figma', href: '/help/documentation/integrations/figma' }
    ]
  },
  {
    title: 'Guides',
    icon: <FileText className="w-4 h-4" />,
    href: '/help/quick-start',
    children: [
      { title: 'Démarrage rapide', href: '/help/quick-start' },
      { title: 'Formation vidéo', href: '/help/video-course' },
      { title: 'FAQ', href: '/help' }
    ]
  }
];

export function DocsSidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>(['API Reference']);
  const [searchTerm, setSearchTerm] = useState('');
  const pathname = usePathname();

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    return pathname === href;
  };

  const filteredItems = sidebarItems.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.children.some(child => 
      child.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <aside className="w-80 bg-gray-800 border-r border-gray-700 h-screen overflow-y-auto sticky top-0">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/help/documentation" className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Luneo Docs</span>
          </Link>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {filteredItems.map((item) => (
            <div key={item.title}>
              <div className="flex items-center">
                {item.children.length > 0 ? (
                  <button
                    onClick={() => toggleExpanded(item.title)}
                    className="flex items-center w-full px-3 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                  >
                    {expandedItems.includes(item.title) ? (
                      <ChevronDown className="w-4 h-4 mr-2" />
                    ) : (
                      <ChevronRight className="w-4 h-4 mr-2" />
                    )}
                    {item.icon}
                    <span className="ml-2">{item.title}</span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center w-full px-3 py-2 text-left rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-2">{item.title}</span>
                  </Link>
                )}
              </div>

              {/* Children */}
              {item.children.length > 0 && expandedItems.includes(item.title) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-6 mt-1 space-y-1"
                >
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                        isActive(child.href)
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      {child.title}
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>
          ))}
        </nav>

        {/* Quick Links */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Liens rapides
          </h3>
          <div className="space-y-2">
            <Link
              href="/help/documentation/api-reference"
              className="flex items-center px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
            >
              <Zap className="w-4 h-4 mr-2" />
              API Reference
            </Link>
            <Link
              href="/help/quick-start"
              className="flex items-center px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
            >
              <FileText className="w-4 h-4 mr-2" />
              Guide de démarrage
            </Link>
            <Link
              href="/contact"
              className="flex items-center px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
            >
              <Users className="w-4 h-4 mr-2" />
              Support
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
