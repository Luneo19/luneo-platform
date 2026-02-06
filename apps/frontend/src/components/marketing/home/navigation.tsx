'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES STRICTS POUR NAVIGATION
// ============================================================================

/**
 * Lien de navigation avec typage strict
 */
interface NavLink {
  href: string;
  label: string;
  description?: string;
}

/**
 * Section de mega-menu avec typage strict
 */
interface MegaMenuSection {
  title: string;
  links: NavLink[];
}

/**
 * Mega-menu avec typage strict
 */
interface MegaMenu {
  product: MegaMenuSection;
  solutions: MegaMenuSection;
  resources: MegaMenuSection;
  pricing: NavLink;
}

/**
 * Navigation Component - Modern navbar with mega-menu
 * Conforme au plan PROJET 4 - Navigation & Footer
 * Based on Pandawa template design avec mega-menu consolidé
 */
export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ Mega-menu consolidé selon PROJET 4
  const megaMenu: MegaMenu = useMemo(
    () => ({
      product: {
        title: 'Produit',
        links: [
          { href: '/features', label: 'Fonctionnalités', description: 'Découvrir nos outils' },
          { href: '/demo', label: 'Démos', description: 'Tester en direct' },
          { href: '/integrations-overview', label: 'Intégrations', description: 'Connecter vos outils' },
          { href: '/pricing', label: 'Tarifs', description: 'Plans et prix' },
        ],
      },
      solutions: {
        title: 'Solutions',
        links: [
          { href: '/solutions/ecommerce', label: 'E-commerce', description: 'Personnalisation produits' },
          { href: '/solutions/marketing', label: 'Marketing', description: 'Campagnes visuelles' },
          { href: '/solutions/branding', label: 'Branding', description: 'Identité de marque' },
          { href: '/solutions/social', label: 'Social Media', description: 'Contenu réseaux sociaux' },
        ],
      },
      resources: {
        title: 'Ressources',
        links: [
          { href: '/help/documentation', label: 'Documentation', description: 'Guides et tutoriels' },
          { href: '/help', label: 'Centre d\'aide', description: 'Support et FAQ' },
          { href: '/community', label: 'Communauté', description: 'Rejoindre la communauté' },
          { href: '/contact', label: 'Contact', description: 'Nous contacter' },
        ],
      },
      pricing: {
        href: '/pricing',
        label: 'Tarifs',
      },
    }),
    [],
  );

  const handleDropdownToggle = useCallback((dropdown: string) => {
    setActiveDropdown((prev) => (prev === dropdown ? null : dropdown));
  }, []);

  const handleDropdownClose = useCallback(() => {
    setActiveDropdown(null);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 py-3'
            : 'py-4'
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
                  <path
                    d="M10 16L14 20L22 12"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <defs>
                    <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
                      <stop stopColor="#6366f1" />
                      <stop offset="1" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">Luneo</span>
            </Link>

            {/* ✅ Desktop Navigation avec Mega-Menu consolidé */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Produit Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('product')}
                onMouseLeave={handleDropdownClose}
              >
                <button
                  onClick={() => handleDropdownToggle('product')}
                  className="px-4 py-2.5 text-gray-600 font-medium text-sm rounded-xl hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center gap-1"
                >
                  Produit
                  <ChevronDown className="w-4 h-4" />
                </button>
                {activeDropdown === 'product' && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 z-[1001]">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">{megaMenu.product.title}</h3>
                    <ul className="space-y-3">
                      {megaMenu.product.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="block px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                          >
                            <span className="block text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                              {link.label}
                            </span>
                            {link.description && (
                              <span className="block text-xs text-gray-500 mt-0.5">{link.description}</span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Solutions Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('solutions')}
                onMouseLeave={handleDropdownClose}
              >
                <button
                  onClick={() => handleDropdownToggle('solutions')}
                  className="px-4 py-2.5 text-gray-600 font-medium text-sm rounded-xl hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center gap-1"
                >
                  Solutions
                  <ChevronDown className="w-4 h-4" />
                </button>
                {activeDropdown === 'solutions' && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 z-[1001]">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">{megaMenu.solutions.title}</h3>
                    <ul className="space-y-3">
                      {megaMenu.solutions.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="block px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                          >
                            <span className="block text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                              {link.label}
                            </span>
                            {link.description && (
                              <span className="block text-xs text-gray-500 mt-0.5">{link.description}</span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Ressources Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('resources')}
                onMouseLeave={handleDropdownClose}
              >
                <button
                  onClick={() => handleDropdownToggle('resources')}
                  className="px-4 py-2.5 text-gray-600 font-medium text-sm rounded-xl hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center gap-1"
                >
                  Ressources
                  <ChevronDown className="w-4 h-4" />
                </button>
                {activeDropdown === 'resources' && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 z-[1001]">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">{megaMenu.resources.title}</h3>
                    <ul className="space-y-3">
                      {megaMenu.resources.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="block px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                          >
                            <span className="block text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                              {link.label}
                            </span>
                            {link.description && (
                              <span className="block text-xs text-gray-500 mt-0.5">{link.description}</span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Pricing Link */}
              <Link
                href={megaMenu.pricing.href}
                className="px-4 py-2.5 text-gray-600 font-medium text-sm rounded-xl hover:text-gray-900 hover:bg-gray-50 transition-all"
              >
                {megaMenu.pricing.label}
              </Link>
            </div>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="font-medium">
                  Connexion
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/50">
                  Commencer
                  <span className="ml-2">→</span>
                </Button>
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ✅ Mobile Menu avec sections consolidées */}
      <div
        className={`fixed inset-0 bg-white z-[999] transition-all duration-300 overflow-y-auto ${
          mobileMenuOpen
            ? 'opacity-100 visible'
            : 'opacity-0 invisible pointer-events-none'
        }`}
        style={{ paddingTop: '100px', paddingBottom: '40px', paddingLeft: '24px', paddingRight: '24px' }}
      >
        {/* Produit */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
            {megaMenu.product.title}
          </h3>
          <ul className="space-y-2">
            {megaMenu.product.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-gray-700 rounded-xl hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Solutions */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
            {megaMenu.solutions.title}
          </h3>
          <ul className="space-y-2">
            {megaMenu.solutions.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-gray-700 rounded-xl hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Ressources */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
            {megaMenu.resources.title}
          </h3>
          <ul className="space-y-2">
            {megaMenu.resources.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-gray-700 rounded-xl hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing */}
        <div className="mb-6">
          <Link
            href={megaMenu.pricing.href}
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 text-base font-medium text-gray-700 rounded-xl hover:bg-gray-50 hover:text-indigo-600 transition-colors"
          >
            {megaMenu.pricing.label}
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="outline" className="w-full">
              Connexion
            </Button>
          </Link>
          <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
            <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600">
              Commencer
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
