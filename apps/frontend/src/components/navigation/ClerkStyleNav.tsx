'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LazyMotionDiv as Motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { 
  ChevronDown, 
  ShoppingCart,
  Box,
  Palette,
  Eye,
  Sparkles,
  Package,
  Building2,
  Code,
  BookOpen,
  Video,
  Star,
  Menu,
  X,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MenuItem {
  title: string;
  href: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

interface MenuData {
  [key: string]: MenuItem[];
}

export function ClerkStyleNav() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current);
      }
    };
  }, []);

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
    // Délai plus long pour éviter les fermetures accidentelles
    const timeout = setTimeout(() => {
      setActiveMenu(null);
      menuTimeoutRef.current = null;
    }, 200);
    menuTimeoutRef.current = timeout;
  }, []);

  const handleButtonLeave = useCallback(() => {
    // Ne ferme pas immédiatement quand on quitte le bouton si le menu est ouvert
    if (activeMenu) {
      const timeout = setTimeout(() => {
        setActiveMenu(null);
        menuTimeoutRef.current = null;
      }, 200);
      menuTimeoutRef.current = timeout;
    }
  }, [activeMenu]);

  const menuData: MenuData = {
    product: [
      {
        title: 'Visual Customizer',
        href: '/solutions/customizer',
        description: 'Personnalisation visuelle illimitée et intuitive',
        icon: <Palette className="w-5 h-5" />
      },
      {
        title: '3D Configurator',
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
    ],
    solutions: [
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
      },
      {
        title: 'Enterprise',
        href: '/enterprise',
        description: 'Solutions personnalisées pour grandes entreprises',
        icon: <Building2 className="w-5 h-5" />
      }
    ],
    industries: [
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
        icon: <Sparkles className="w-5 h-5" />
      },
      {
        title: 'Sporting Goods',
        href: '/industries/sports',
        description: 'Équipements sportifs personnalisables',
        icon: <Zap className="w-5 h-5" />
      },
      {
        title: 'Jewellery',
        href: '/industries/jewellery',
        description: 'Virtual try-ons pour bijoux',
        icon: <Star className="w-5 h-5" />
      }
    ],
    docs: [
      {
        title: 'Documentation',
        href: '/help/documentation',
        description: 'Guides complets et API reference',
        icon: <BookOpen className="w-5 h-5" />
      },
      {
        title: 'API Reference',
        href: '/help/documentation/api-reference',
        description: 'Documentation API détaillée',
        icon: <Code className="w-5 h-5" />
      },
      {
        title: 'Video Tutorials',
        href: '/help/video-course',
        description: 'Tutoriels et guides vidéo',
        icon: <Video className="w-5 h-5" />
      },
      {
        title: 'Demo Store',
        href: '/demo',
        description: 'Testez Luneo en temps réel',
        icon: <Box className="w-5 h-5" />
      }
    ]
  };

  const renderDropdown = (menuKey: string) => {
    const items = menuData[menuKey];
    if (!items) return null;

    return (
    <AnimatePresence>
        {activeMenu === menuKey && (
          <>
            {/* Overlay */}
            <Motion
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/5 z-[9998]"
              onClick={handleMenuLinkClick}
              style={{ top: '64px' }}
            />
            {/* Dropdown Menu - Style Clerk */}
        <Motion
              initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 right-0 bg-white border-b border-gray-100 shadow-lg"
              onMouseEnter={() => {
                if (menuTimeoutRef.current) {
                  clearTimeout(menuTimeoutRef.current);
                  menuTimeoutRef.current = null;
                }
                handleMenuEnter(menuKey);
              }}
              onMouseLeave={handleMenuLeave}
              style={{ 
                top: '64px',
                zIndex: 9999,
                pointerEvents: 'auto'
              }}
            >
              <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <Link
              key={index}
                      href={item.href}
                      onClick={handleMenuLinkClick}
                      className="group flex flex-col gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-950">
                              {item.title}
                            </h3>
                    {item.badge && (
                              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                        {item.badge}
                      </span>
                    )}
                  </div>
                          <p className="text-xs text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                </div>
              </div>
            </Link>
          ))}
                </div>
              </div>
        </Motion>
          </>
      )}
    </AnimatePresence>
    );
  };

  return (
    <>
      {/* Main Navigation - Style Clerk */}
    <nav 
        className="sticky top-0 bg-white border-b border-gray-200 z-[10000]"
        style={{ zIndex: 10000 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center z-[10001] relative">
            <Image
              src="/logo.png"
              alt="Luneo"
              width={200}
              height={64}
              className="h-10 md:h-12 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
            {/* Produit */}
            <div className="relative" style={{ zIndex: 10001 }}>
              <button
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1 rounded-md hover:bg-gray-50 transition-colors"
                onMouseEnter={() => handleMenuEnter('product')}
                onMouseLeave={handleButtonLeave}
                style={{ position: 'relative', zIndex: 10001 }}
              >
                <span>Produit</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeMenu === 'product' ? 'rotate-180' : ''
                    }`}
                  />
              </button>
                {renderDropdown('product')}
            </div>

            {/* Solutions */}
            <div className="relative" style={{ zIndex: 10001 }}>
              <button
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1 rounded-md hover:bg-gray-50 transition-colors"
                onMouseEnter={() => handleMenuEnter('solutions')}
                onMouseLeave={handleButtonLeave}
                style={{ position: 'relative', zIndex: 10001 }}
              >
                <span>Solutions</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeMenu === 'solutions' ? 'rotate-180' : ''
                    }`}
                  />
              </button>
                {renderDropdown('solutions')}
            </div>

            {/* Industries */}
            <div className="relative" style={{ zIndex: 10001 }}>
              <button
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1 rounded-md hover:bg-gray-50 transition-colors"
                onMouseEnter={() => handleMenuEnter('industries')}
                onMouseLeave={handleButtonLeave}
                style={{ position: 'relative', zIndex: 10001 }}
              >
                <span>Industries</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeMenu === 'industries' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {renderDropdown('industries')}
              </div>

              {/* Documentation */}
              <div className="relative" style={{ zIndex: 10001 }}>
                <button
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1 rounded-md hover:bg-gray-50 transition-colors"
                  onMouseEnter={() => handleMenuEnter('docs')}
                  onMouseLeave={handleButtonLeave}
                  style={{ position: 'relative', zIndex: 10001 }}
                >
                  <span>Documentation</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeMenu === 'docs' ? 'rotate-180' : ''
                    }`}
                  />
              </button>
                {renderDropdown('docs')}
            </div>

            {/* Tarifs */}
            <Link
              href="/pricing"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
            >
              Tarifs
            </Link>
          </div>

            {/* Actions côté droit */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Connexion
            </Link>
            <Link href="/register">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 h-9 rounded-md flex items-center gap-2">
                  <span className="text-white">Commencer</span>
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-md hover:bg-gray-50 transition-colors"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
            ) : (
                <Menu className="w-5 h-5 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <Motion
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t bg-white"
          >
            <div className="px-4 py-6 space-y-4">
              <Link
                href="/pricing"
                onClick={handleMenuLinkClick}
                className="block py-2 text-base font-medium text-gray-900"
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
                  <Button className="w-full bg-gray-900 hover:bg-gray-800">
                    <span className="text-white">Commencer</span>
                  </Button>
                </Link>
              </div>
            </div>
          </Motion>
        )}
      </AnimatePresence>
    </nav>
    </>
  );
}