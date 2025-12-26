'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ShoppingCart,
  Box,
  Palette,
  Eye,
  Sparkles,
  Package,
  Gift,
  Gem,
  Sofa,
  Wine,
  Code,
  BookOpen,
  Video,
  Star,
  Download,
  Menu,
  X,
  Zap,
  Building2,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MenuItem {
  title: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export function ProfessionalNav() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLNavElement>(null);

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current);
      }
    };
  }, []);

  // Fermer le menu quand on clique sur un lien
  const handleMenuLinkClick = useCallback(() => {
    setActiveMenu(null);
    setIsMobileMenuOpen(false);
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const handleMenuEnter = useCallback((menu: string) => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
    setActiveMenu(menu);
  }, []);

  const handleMenuLeave = useCallback(() => {
    const timeout = setTimeout(() => {
      setActiveMenu(null);
      menuTimeoutRef.current = null;
    }, 150);
    menuTimeoutRef.current = timeout;
  }, []);

  const menuData: Record<string, MenuSection[]> = {
    solutions: [
      {
        title: 'Produits',
        items: [
          {
            title: 'Visual Product Customizer',
      href: '/solutions/customizer',
            description: 'Personnalisation visuelle illimitée et intuitive',
      icon: <Palette className="w-5 h-5" />,
            badge: 'Populaire'
    },
    {
            title: '3D Product Configurator',
      href: '/solutions/configurator-3d',
            description: 'Configuration 3D en temps réel pour vos produits',
            icon: <Box className="w-5 h-5" />
    },
    {
            title: 'AI Design Hub',
      href: '/solutions/ai-design-hub',
      description: 'Génération de designs IA en masse',
            icon: <Sparkles className="w-5 h-5" />
    },
    {
            title: 'Virtual Try-On',
      href: '/solutions/virtual-try-on',
      description: 'Essayage virtuel AR pour e-commerce',
            icon: <Eye className="w-5 h-5" />
          }
        ]
    },
      {
        title: 'Cas d\'usage',
        items: [
    {
            title: 'E-commerce',
      href: '/solutions/ecommerce',
            description: 'Boostez vos ventes avec la personnalisation',
            icon: <ShoppingCart className="w-5 h-5" />
    },
    {
            title: 'Marketing',
      href: '/solutions/marketing',
            description: 'Créer des campagnes visuelles engageantes',
            icon: <Zap className="w-5 h-5" />
    },
    {
            title: 'Branding',
      href: '/solutions/branding',
            description: 'Renforcez votre identité de marque',
            icon: <Star className="w-5 h-5" />
          }
        ]
      }
  ],
  industries: [
    {
        title: 'Industries',
        items: [
          {
            title: 'Printing & POD',
            href: '/industries/printing',
            description: 'Web-to-print personnalisation simplifiée',
            icon: <Package className="w-5 h-5" />
          },
          {
            title: 'Fashion & Luxury',
            href: '/industries/fashion',
            description: 'Modèles 3D photoréalistes pour la mode',
            icon: <Gem className="w-5 h-5" />
          },
          {
            title: 'Sporting Goods',
      href: '/industries/sports',
            description: 'Équipements sportifs personnalisables',
            icon: <Zap className="w-5 h-5" />
    },
    {
            title: 'Jewellery & Accessories',
      href: '/industries/jewellery',
            description: 'Virtual try-ons pour bijoux',
            icon: <Gem className="w-5 h-5" />
    },
    {
            title: 'Furniture',
      href: '/industries/furniture',
            description: 'Configuration 3D et AR pour mobilier',
            icon: <Sofa className="w-5 h-5" />
          },
          {
            title: 'Food & Beverage',
            href: '/industries/food-beverage',
            description: 'Design labels et packaging custom',
            icon: <Wine className="w-5 h-5" />
          }
        ]
      }
  ],
  resources: [
    {
        title: 'Documentation',
        items: [
          {
            title: 'Help Guides',
            href: '/help/quick-start',
            description: 'Toutes vos questions répondues',
            icon: <BookOpen className="w-5 h-5" />
          },
          {
            title: 'API Documentation',
            href: '/help/documentation/api-reference',
            description: 'Documentation API détaillée',
            icon: <Code className="w-5 h-5" />
          },
          {
            title: 'Video Hub',
            href: '/help/video-course',
            description: 'Tutoriels et guides vidéo',
            icon: <Video className="w-5 h-5" />
          }
        ]
      },
      {
        title: 'Ressources',
        items: [
          {
            title: 'Demo Store',
            href: '/demo',
            description: 'Testez Luneo en temps réel',
            icon: <Box className="w-5 h-5" />,
            badge: 'Nouveau'
          },
          {
            title: 'Success Stories',
      href: '/success-stories',
            description: 'Vraies réussites de vraies marques',
            icon: <Star className="w-5 h-5" />
          },
          {
            title: 'Free Resources',
            href: '/resources/free',
            description: 'Templates, guides, lookbooks gratuits',
            icon: <Download className="w-5 h-5" />
          }
        ]
      }
    ],
    integrations: [
      {
        title: 'Intégrations',
        items: [
          {
            title: 'Shopify',
            href: '/integrations/shopify',
            description: 'Intégration native Shopify',
            icon: <ShoppingCart className="w-5 h-5" />
          },
          {
            title: 'WooCommerce',
            href: '/integrations/woocommerce',
            description: 'Plugin officiel WooCommerce',
            icon: <ShoppingCart className="w-5 h-5" />
          },
          {
            title: 'API',
            href: '/help/documentation/api-reference',
            description: 'Intégration via API REST',
            icon: <Code className="w-5 h-5" />
          }
        ]
      }
    ]
  };

  const renderMegaMenu = (menuKey: string) => {
    const sections = menuData[menuKey];
    if (!sections) return null;

    return (
      <AnimatePresence>
        {activeMenu === menuKey && (
          <>
            {/* Overlay pour fermer le menu - positionné en fixed */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/10 backdrop-blur-sm"
              onClick={handleMenuLinkClick}
              style={{ 
                top: '64px',
                zIndex: 9998,
                pointerEvents: 'auto'
              }}
            />
            {/* Menu déroulant - positionné en fixed pour être au-dessus de tout */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed left-0 right-0 bg-white border-b border-gray-200 shadow-2xl"
              onMouseEnter={() => handleMenuEnter(menuKey)}
              onMouseLeave={handleMenuLeave}
              style={{ 
                top: '64px',
                zIndex: 9999,
                maxHeight: 'calc(100vh - 64px)',
                overflowY: 'auto'
              }}
            >
              <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                  {sections.map((section, sectionIndex) => (
                    <div key={sectionIndex}>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                        {section.title}
                      </h3>
                      <ul className="space-y-1">
                        {section.items.map((item, itemIndex) => (
                          <li key={itemIndex}>
                            <Link
                              href={item.href}
                              onClick={handleMenuLinkClick}
                              className="group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {item.title}
                  </span>
                  {item.badge && (
                                    <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium">
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.description && (
                                  <p className="text-xs text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
          ))}
                </div>
              </div>
        </motion.div>
          </>
      )}
    </AnimatePresence>
  );
  };

  return (
    <nav 
      ref={navRef}
      className="sticky top-0 bg-white border-b border-gray-200 shadow-sm"
      style={{ zIndex: 10000 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center z-[101] relative">
            <Image
              src="/logo.png"
              alt="Luneo Logo"
              width={150}
              height={50}
              className="h-8 md:h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Navigation desktop */}
          <div className="hidden lg:flex items-center space-x-1">
            {/* Solutions */}
            <div className="relative" style={{ zIndex: 10001 }}>
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1 rounded-lg hover:bg-gray-50 transition-colors"
                onMouseEnter={() => handleMenuEnter('solutions')}
                onMouseLeave={handleMenuLeave}
                onClick={() => handleMenuEnter('solutions')}
              >
                <span>Solutions</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    activeMenu === 'solutions' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {renderMegaMenu('solutions')}
            </div>

            {/* Industries */}
            <div className="relative" style={{ zIndex: 10001 }}>
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1 rounded-lg hover:bg-gray-50 transition-colors"
                onMouseEnter={() => handleMenuEnter('industries')}
                onMouseLeave={handleMenuLeave}
                onClick={() => handleMenuEnter('industries')}
              >
                <span>Industries</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    activeMenu === 'industries' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {renderMegaMenu('industries')}
            </div>

            {/* Produits */}
            <Link
              href="/produits"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Produits
            </Link>

            {/* Intégrations */}
            <div className="relative" style={{ zIndex: 10001 }}>
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1 rounded-lg hover:bg-gray-50 transition-colors"
                onMouseEnter={() => handleMenuEnter('integrations')}
                onMouseLeave={handleMenuLeave}
                onClick={() => handleMenuEnter('integrations')}
              >
                <span>Intégrations</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    activeMenu === 'integrations' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {renderMegaMenu('integrations')}
            </div>

            {/* Tarifs */}
            <Link
              href="/pricing"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Tarifs
            </Link>

            {/* Ressources */}
            <div className="relative" style={{ zIndex: 10001 }}>
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1 rounded-lg hover:bg-gray-50 transition-colors"
                onMouseEnter={() => handleMenuEnter('resources')}
                onMouseLeave={handleMenuLeave}
                onClick={() => handleMenuEnter('resources')}
              >
                <span>Ressources</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    activeMenu === 'resources' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {renderMegaMenu('resources')}
            </div>
          </div>

          {/* CTAs Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
                Connexion
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                Commencer
              </Button>
            </Link>
          </div>

          {/* Hamburger Menu Button - Mobile */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t bg-white"
          >
            <div className="px-4 py-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <Link
                href="/produits"
                onClick={handleMenuLinkClick}
                className="block py-2 text-base font-medium text-gray-900 hover:text-blue-600"
                >
                  Produits
                      </Link>
              <Link
                href="/pricing"
                onClick={handleMenuLinkClick}
                className="block py-2 text-base font-medium text-gray-900 hover:text-blue-600"
              >
                Tarifs
              </Link>
              <div className="pt-4 border-t space-y-3">
                <Link href="/login" onClick={handleMenuLinkClick} className="block w-full">
                  <Button variant="outline" className="w-full">
                    Connexion
                  </Button>
                </Link>
                <Link href="/register" onClick={handleMenuLinkClick} className="block w-full">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                    Commencer
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
