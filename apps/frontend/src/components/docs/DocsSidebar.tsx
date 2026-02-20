'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
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
  Search,
  X,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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

function DocsSidebarContent({ open = false, onClose }: { open?: boolean; onClose?: () => void } = {}) {
  const [expandedItems, setExpandedItems] = useState<string[]>(['API Reference']);
  const [searchTerm, setSearchTerm] = useState('');
  const pathname = usePathname();

  const toggleExpanded = useCallback((title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  }, []);

  const isActive = useCallback((href: string) => {
    return pathname === href;
  }, [pathname]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const filteredItems = useMemo(() => sidebarItems.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.children.some(child => 
      child.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ), [searchTerm]);

  return (
    <>
      <aside className="hidden md:flex md:flex-col w-72 lg:w-80 bg-[#0a0a0f] border-r border-white/[0.06] min-h-screen overflow-y-auto sticky top-0 shrink-0" aria-label="Documentation navigation">
      <div className="p-6"><div className="pt-8 px-4 pb-4 md:px-6"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20" /></div></div>

        {/* Navigation */}
        <nav className="px-4 pb-6 md:px-6 space-y-1">
          {filteredItems.map((item) => (
            <div key={item.title}>
              <div className="flex items-center">
                {item.children.length > 0 ? (
                  <button type="button" onClick={() => toggleExpanded(item.title)}
                    className="flex items-center w-full px-3 py-2.5 text-left text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
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
                        ? 'text-white bg-white/10'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-2">{item.title}</span>
                  </Link>
                )}
              </div>

              {/* Children */}
              {item.children.length > 0 && expandedItems.includes(item.title) && (
                <motion
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
                          ? 'text-white bg-white/10'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {child.title}
                    </Link>
                  ))}
                </motion>
              )}
            </div>
          ))}
        </nav>

        {/* Quick Links */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
            Liens rapides
          </h3>
          <div className="space-y-2">
            <Link
              href="/help/documentation/api-reference"
              className="flex items-center px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Zap className="w-4 h-4 mr-2" />
              API Reference
            </Link>
            <Link
              href="/help/quick-start"
              className="flex items-center px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4 mr-2" />
              Guide de démarrage
            </Link>
            <Link
              href="/contact"
              className="flex items-center px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Users className="w-4 h-4 mr-2" />
              Support
            </Link>
          </div>
        </div>
      </div>
    </aside>

      {onClose && (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label="Fermer le menu"
            onClick={onClose}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
            className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          />
          <aside
            aria-label="Documentation navigation"
            aria-hidden={!open}
            className={`fixed top-0 left-0 z-50 flex flex-col w-[min(320px,85vw)] max-w-sm bg-[#0a0a0f] border-r border-white/[0.06] min-h-full overflow-y-auto md:hidden transform transition-transform duration-200 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
          >
            <div className="flex items-center justify-between px-4 pt-6 pb-2 border-b border-white/10 shrink-0">
              <span className="text-sm font-medium text-white/70">Menu</span>
              <button type="button" onClick={onClose} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5" aria-label="Fermer le menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="pt-4 px-4 pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={handleSearchChange} className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20" />
              </div>
            </div>
            <nav className="px-4 pb-6 space-y-1">
              {filteredItems.map((item) => (
                <div key={item.title}>
                  <div className="flex items-center">
                    {item.children.length > 0 ? (
                      <button type="button" onClick={() => toggleExpanded(item.title)} className="flex items-center w-full px-3 py-2.5 text-left text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        {expandedItems.includes(item.title) ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                        {item.icon}
                        <span className="ml-2">{item.title}</span>
                      </button>
                    ) : (
                      <Link href={item.href} onClick={onClose} className={`flex items-center w-full px-3 py-2.5 text-left rounded-lg transition-colors ${isActive(item.href) ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                        {item.icon}
                        <span className="ml-2">{item.title}</span>
                      </Link>
                    )}
                  </div>
                  {item.children.length > 0 && expandedItems.includes(item.title) && (
                    <motion initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="ml-6 mt-1 space-y-0.5">
                      {item.children.map((child) => (
                        <Link key={child.href} href={child.href} onClick={onClose} className={`block px-3 py-2 text-sm rounded-lg transition-colors ${isActive(child.href) ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                          {child.title}
                        </Link>
                      ))}
                    </motion>
                  )}
                </div>
              ))}
            </nav>
            <div className="mt-6 pt-6 px-4 border-t border-white/10">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Liens rapides</h3>
              <div className="space-y-0.5">
                <Link href="/help/documentation/api-reference" onClick={onClose} className="flex items-center px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Zap className="w-4 h-4 mr-2" />API Reference</Link>
                <Link href="/help/quick-start" onClick={onClose} className="flex items-center px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><FileText className="w-4 h-4 mr-2" />Guide de démarrage</Link>
                <Link href="/contact" onClick={onClose} className="flex items-center px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Users className="w-4 h-4 mr-2" />Support</Link>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

const DocsSidebarContentMemo = memo(DocsSidebarContent);

export function DocsSidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void } = {}) {
  return (
    <ErrorBoundary componentName="DocsSidebar">
      <DocsSidebarContentMemo open={open} onClose={onClose} />
    </ErrorBoundary>
  );
}
