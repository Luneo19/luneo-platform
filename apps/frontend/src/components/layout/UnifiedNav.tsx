'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import { LazyMotionDiv as Motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Logo } from '@/components/Logo';

function UnifiedNavContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = useCallback((dropdown: string) => {
    setActiveDropdown((prev) => prev === dropdown ? null : dropdown);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const dropdownItems = useMemo(() => ({
    product: [
      { name: 'AI Studio', href: '/studio', description: 'Créer des designs avec IA' },
      { name: 'AR Studio', href: '/ar-studio', description: 'Réalité augmentée' },
      { name: 'Templates', href: '/templates', description: 'Bibliothèque de modèles' },
      { name: 'Galerie', href: '/gallery', description: 'Exemples de créations' },
      { name: 'Fonctionnalités', href: '/features', description: 'Découvrir nos outils' }
    ],
    solutions: [
      { name: 'E-commerce', href: '/solutions/ecommerce', description: 'Designs pour boutiques' },
      { name: 'Marketing', href: '/solutions/marketing', description: 'Campagnes visuelles' },
      { name: 'Branding', href: '/solutions/branding', description: 'Identité de marque' },
      { name: 'Social Media', href: '/solutions/social', description: 'Contenu réseaux sociaux' },
      { name: 'Intégrations', href: '/integrations-overview', description: 'Connecter vos outils' }
    ],
    resources: [
      { name: 'Documentation', href: '/help/documentation', description: 'Guide complet' },
      { name: 'Guide démarrage', href: '/help/quick-start', description: 'Premiers pas' },
      { name: 'Formation vidéo', href: '/help/video-course', description: 'Tutoriels vidéo' },
      { name: 'API Reference', href: '/help/documentation/api-reference', description: 'Développeurs' },
      { name: 'Centre d\'aide', href: '/help', description: 'FAQ et support' }
    ],
    pricing: [
      { name: 'Voir les tarifs', href: '/pricing', description: 'Plans et prix' },
      { name: 'Essai gratuit', href: '/register', description: '14 jours gratuits' },
      { name: 'Comparaison', href: '/pricing#comparison', description: 'Comparer les plans' }
    ],
    company: [
      { name: 'À propos', href: '/about', description: 'Notre histoire' },
      { name: 'Blog', href: '/blog', description: 'Actualités et conseils' },
      { name: 'Contact', href: '/contact', description: 'Nous contacter' },
      { name: 'Support', href: '/contact', description: 'Aide et assistance' }
    ]
  }), []);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo href="/" size="default" showText={true} variant="light" />

          {/* Desktop Navigation with Dropdowns */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Product Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setActiveDropdown('product')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button 
                onClick={() => toggleDropdown('product')}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Produit
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              
              <AnimatePresence>
                {activeDropdown === 'product' && (
                  <Motion
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-2"
                  >
                    {dropdownItems.product.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                      </Link>
                    ))}
                  </Motion>
                )}
              </AnimatePresence>
            </div>

            {/* Solutions Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setActiveDropdown('solutions')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button 
                onClick={() => toggleDropdown('solutions')}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Solutions
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              
              <AnimatePresence>
                {activeDropdown === 'solutions' && (
                  <Motion
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-2"
                  >
                    {dropdownItems.solutions.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                      </Link>
                    ))}
                  </Motion>
                )}
              </AnimatePresence>
            </div>

            {/* Docs Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setActiveDropdown('resources')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button 
                onClick={() => toggleDropdown('resources')}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Ressources
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              
              <AnimatePresence>
                {activeDropdown === 'resources' && (
                  <Motion
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-2"
                  >
                    {dropdownItems.resources.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                      </Link>
                    ))}
                  </Motion>
                )}
              </AnimatePresence>
            </div>

            {/* Pricing Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setActiveDropdown('pricing')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button 
                onClick={() => toggleDropdown('pricing')}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Tarifs
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              
              <AnimatePresence>
                {activeDropdown === 'pricing' && (
                  <Motion
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-2"
                  >
                    {dropdownItems.pricing.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                      </Link>
                    ))}
                  </Motion>
                )}
              </AnimatePresence>
            </div>

            {/* Company Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setActiveDropdown('company')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button 
                onClick={() => toggleDropdown('company')}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Entreprise
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              
              <AnimatePresence>
                {activeDropdown === 'company' && (
                  <Motion
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-2"
                  >
                    {dropdownItems.company.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                      </Link>
                    ))}
                  </Motion>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <Link 
              href="/login" 
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              Se connecter
            </Link>
            <Link 
              href="/register" 
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-md hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center"
            >
              Commencer à construire
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <Motion
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-gray-200 bg-white overflow-hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {/* Mobile dropdowns */}
                {Object.entries(dropdownItems).map(([key, items]) => (
                  <div key={key} className="space-y-1">
                    <div className="px-3 py-2 text-sm font-medium text-gray-900 capitalize">
                      {key === 'docs' ? 'Docs' : key === 'pricing' ? 'Tarifs' : key === 'company' ? 'Entreprise' : key === 'solutions' ? 'Solutions' : 'Produit'}
                    </div>
                    {items.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-6 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                        onClick={closeMenu}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
              <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
                <Link 
                  href="/login" 
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-md hover:bg-gray-50 transition-colors"
                  onClick={closeMenu}
                >
                  Se connecter
                </Link>
                <Link 
                  href="/register" 
                  className="block px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-md hover:from-blue-700 hover:to-purple-700 transition-colors text-center"
                  onClick={closeMenu}
                >
                  Commencer à construire
                </Link>
              </div>
            </Motion>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

const UnifiedNavContentMemo = memo(UnifiedNavContent);

export function UnifiedNav() {
  return (
    <ErrorBoundary componentName="UnifiedNav">
      <UnifiedNavContentMemo />
    </ErrorBoundary>
  );
}

