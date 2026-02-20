'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Box,
  ChevronDown,
  Code,
  Download,
  Eye,
  Gem,
  Gift,
  Menu,
  Package,
  Palette,
  ShoppingCart,
  Sofa,
  Sparkles,
  Star,
  Video,
  Wine,
  X,
  Zap
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

function ZakekeStyleNavContent() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleMenuToggle = useCallback((menu: string) => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
    setActiveMenu((prev) => prev === menu ? null : menu);
  }, []);

  const handleMenuLeave = useCallback(() => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }
    const timeout = setTimeout(() => {
      setActiveMenu(null);
      menuTimeoutRef.current = null;
    }, 200); // Délai de 200ms avant fermeture
    menuTimeoutRef.current = timeout;
  }, []);

  const navigation = useMemo(() => ({
    jeVeux: [
      {
        icon: <ShoppingCart className="w-6 h-6" />,
        title: "Automatiser mes commandes personnalisées",
        description: "Offrez la personnalisation sans retouches Photoshop ni casse-tête workflow",
        href: "/solutions/customizer"
      },
      {
        icon: <Box className="w-6 h-6" />,
        title: "Présenter mes produits de façon réaliste",
        description: "Adieu images statiques, bonjour présentation 3D qui valorise",
        href: "/solutions/configurator-3d"
      },
      {
        icon: <Package className="w-6 h-6" />,
        title: "Afficher mes variantes sans photos",
        description: "Clients explorent et personnalisent chaque variante en 3D - zéro stock, zéro photo",
        href: "/solutions/configurator-3d"
      },
      {
        icon: <Sparkles className="w-6 h-6" />,
        title: "Me différencier avec une expérience unique",
        description: "Différenciez votre marque avec des expériences produit engageantes et immersives",
        href: "/solutions/virtual-try-on"
      },
      {
        icon: <Zap className="w-6 h-6" />,
        title: "Générer des designs IA en masse",
        description: "Créez 1000 variantes en 1h au lieu de 1 mois - coût par design: €0.50",
        href: "/solutions/ai-design-hub"
      }
    ],
    solutions: [
      {
        icon: <Palette className="w-6 h-6 text-blue-400" />,
        title: "Visual Product Customizer",
        description: "Personnalisation illimitée, intuitive, sans casse-tête design",
        href: "/solutions/customizer",
        badge: "Populaire"
      },
      {
        icon: <Box className="w-6 h-6 text-purple-400" />,
        title: "3D Product Configurator",
        description: "Produits sur-mesure en 3D au bout des doigts de vos clients",
        href: "/solutions/configurator-3d"
      },
      {
        icon: <Sparkles className="w-6 h-6 text-pink-400" />,
        title: "AI Design Hub",
        description: "Votre hub pour créer, gérer et déployer des designs IA partout",
        href: "/solutions/ai-design-hub"
      },
      {
        icon: <Eye className="w-6 h-6 text-cyan-400" />,
        title: "Virtual Try-On",
        description: "Essayage virtuel IA, hyper-réaliste, sans app pour e-commerce",
        href: "/solutions/virtual-try-on"
      }
    ],
    industries: [
      {
        icon: <Package className="w-5 h-5" />,
        title: "Printing",
        description: "Web-to-print personnalisation simplifiée avec process design fluides",
        href: "/industries/printing"
      },
      {
        icon: <Gem className="w-5 h-5" />,
        title: "Fashion & Luxury",
        description: "Modèles 3D photoréalistes et customisation dynamique pour collections mode",
        href: "/industries/fashion"
      },
      {
        icon: <Zap className="w-5 h-5" />,
        title: "Sporting Goods",
        description: "Équipements sportifs personnalisables avec process automatisés",
        href: "/industries/sports"
      },
      {
        icon: <Gift className="w-5 h-5" />,
        title: "Gadget & Gifting",
        description: "Commandes custom simplifiées pour gadgets et cadeaux",
        href: "/industries/gifting"
      },
      {
        icon: <Gem className="w-5 h-5" />,
        title: "Jewellery & Accessories",
        description: "Modèles 3D réalistes, customisation live, virtual try-ons bijoux",
        href: "/industries/jewellery"
      },
      {
        icon: <Sofa className="w-5 h-5" />,
        title: "Furniture",
        description: "Vente améliorée 3D et AR avec configurations custom mobilier",
        href: "/industries/furniture"
      },
      {
        icon: <Wine className="w-5 h-5" />,
        title: "Food & Beverage",
        description: "Design labels et packaging custom avec impression avancée",
        href: "/industries/food-beverage"
      }
    ],
    integrations: [
      {
        title: "Shopify",
        logo: "🛍️",
        href: "/help/documentation/integrations/shopify"
      },
      {
        title: "WooCommerce",
        logo: "🛒",
        href: "/help/documentation/integrations/woocommerce"
      },
      {
        title: "Wix",
        logo: "🌐",
        href: "/integrations/wix",
        badge: "Nouveau"
      },
      {
        title: "API",
        logo: "⚡",
        href: "/help/documentation/api-reference"
      }
    ],
    resources: [
      {
        icon: <BookOpen className="w-5 h-5 text-blue-400" />,
        title: "Help Guides",
        description: "Toutes vos questions répondues",
        href: "/help/quick-start"
      },
      {
        icon: <Code className="w-5 h-5 text-green-400" />,
        title: "API Documentation",
        description: "Documentation API détaillée",
        href: "/help/documentation/api-reference"
      },
      {
        icon: <Package className="w-5 h-5 text-purple-400" />,
        title: "Demo Store",
        description: "Testez Luneo en temps réel",
        href: "/demo",
        badge: "Nouveau"
      },
      {
        icon: <Video className="w-5 h-5 text-red-400" />,
        title: "Video Hub",
        description: "Tutoriels et guides vidéo",
        href: "/help/video-course"
      },
      {
        icon: <Star className="w-5 h-5 text-yellow-400" />,
        title: "Success Stories",
        description: "Vraies réussites de vraies marques",
        href: "/success-stories",
        badge: "Nouveau"
      },
      {
        icon: <Download className="w-5 h-5 text-cyan-400" />,
        title: "Free Resources",
        description: "Templates, guides, lookbooks gratuits",
        href: "/resources/free"
      }
    ]
  }), []);

  interface NavItem {
    icon?: React.ReactNode;
    logo?: string;
    title: string;
    description?: string;
    href: string;
    badge?: string;
  }

  const MegaMenu = useCallback(({ items, type }: { items: NavItem[], type: string }) => (
    <AnimatePresence>
      {activeMenu === type && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute top-full left-0 w-full bg-white/98 backdrop-blur-md shadow-2xl border-t border-gray-200 z-[100]"
          style={{ zIndex: 100 }}
          onMouseEnter={() => {
            if (menuTimeoutRef.current) {
              clearTimeout(menuTimeoutRef.current);
              menuTimeoutRef.current = null;
            }
          }}
          onMouseLeave={handleMenuLeave}
        >
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className={`grid ${type === 'jeVeux' ? 'grid-cols-2' : type === 'industries' ? 'grid-cols-3' : 'grid-cols-2'} gap-6`}>
              {items.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  onClick={handleMenuLinkClick}
                  className="group min-h-11 p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border border-transparent hover:border-blue-100 hover:shadow-md"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 min-w-11 min-h-11 w-11 h-11 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      {item.icon || item.logo}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h3>
                        {item.badge && (
                          <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [activeMenu, handleMenuLinkClick]);

  return (
    <nav className="sticky top-0 z-[100] bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - 5x plus grand */}
          <Link href="/" className="relative z-10 flex items-center">
            <Image
              src="/logo.png"
              alt="Luneo Logo"
              width={750}
              height={300}
              className="h-20 md:h-24 lg:h-28 w-auto object-contain"
              priority
            />
          </Link>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Je veux... */}
            <button
              className="relative px-4 py-2 text-gray-700 hover:text-gray-900 font-medium flex items-center space-x-1 rounded-lg hover:bg-gray-50 transition-colors"
              onMouseEnter={() => handleMenuToggle('jeVeux')}
              onMouseLeave={handleMenuLeave}
            >
              <span>Je veux...</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeMenu === 'jeVeux' ? 'rotate-180' : ''}`} />
            </button>

            {/* Produits */}
            <Link
              href="/produits"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Produits
            </Link>

            {/* Solutions */}
            <button
              className="relative px-4 py-2 text-gray-700 hover:text-gray-900 font-medium flex items-center space-x-1 rounded-lg hover:bg-gray-50 transition-colors"
              onMouseEnter={() => handleMenuToggle('solutions')}
              onMouseLeave={handleMenuLeave}
            >
              <span>Solutions</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeMenu === 'solutions' ? 'rotate-180' : ''}`} />
            </button>

            {/* Industries */}
            <button
              className="relative px-4 py-2 text-gray-700 hover:text-gray-900 font-medium flex items-center space-x-1 rounded-lg hover:bg-gray-50 transition-colors"
              onMouseEnter={() => handleMenuToggle('industries')}
              onMouseLeave={handleMenuLeave}
            >
              <span>Industries</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeMenu === 'industries' ? 'rotate-180' : ''}`} />
            </button>

            {/* Intégrations */}
            <button
              className="relative px-4 py-2 text-gray-700 hover:text-gray-900 font-medium flex items-center space-x-1 rounded-lg hover:bg-gray-50 transition-colors"
              onMouseEnter={() => handleMenuToggle('integrations')}
              onMouseLeave={handleMenuLeave}
            >
              <span>Intégrations</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeMenu === 'integrations' ? 'rotate-180' : ''}`} />
            </button>

            {/* Tarifs */}
            <Link
              href="/pricing"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Tarifs
            </Link>

            {/* Ressources */}
            <button
              className="relative px-4 py-2 text-gray-700 hover:text-gray-900 font-medium flex items-center space-x-1 rounded-lg hover:bg-gray-50 transition-colors"
              onMouseEnter={() => handleMenuToggle('resources')}
              onMouseLeave={handleMenuLeave}
            >
              <span>Ressources</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeMenu === 'resources' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* CTAs Desktop only */}
          <div className="hidden md:flex items-center space-x-3">
            <Link href="/login" className="text-gray-700 hover:text-gray-900 font-medium text-sm">
              Connexion
            </Link>

            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                Essayer gratuitement
              </Button>
            </Link>
          </div>

          {/* Hamburger Menu Button - Mobile only */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden min-w-11 min-h-11 p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
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

      {/* Mobile Menu - COMPLET */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t bg-white shadow-lg max-h-[80vh] overflow-y-auto"
        >
          <div className="px-4 py-6 space-y-4">
            {/* Produits */}
            <div>
              <div className="font-bold text-gray-900 mb-2">Produits</div>
              <div className="space-y-2 pl-4">
                <Link href="/produits" onClick={handleMenuLinkClick} className="block min-h-11 py-3 text-sm text-gray-700 hover:text-blue-600 font-semibold">
                  Tous les produits →
                </Link>
                <Link href="/solutions/customizer" onClick={handleMenuLinkClick} className="block min-h-11 py-3 text-sm text-gray-700 hover:text-blue-600">
                  Visual Customizer
                </Link>
                <Link href="/solutions/configurator-3d" onClick={handleMenuLinkClick} className="block min-h-11 py-3 text-sm text-gray-700 hover:text-blue-600">
                  3D Configurator
                </Link>
                <Link href="/solutions/ai-design-hub" onClick={handleMenuLinkClick} className="block min-h-11 py-3 text-sm text-gray-700 hover:text-blue-600">
                  AI Design Hub
                </Link>
                <Link href="/solutions/virtual-try-on" onClick={handleMenuLinkClick} className="block min-h-11 py-3 text-sm text-gray-700 hover:text-blue-600">
                  Virtual Try-On
                </Link>
              </div>
            </div>

            {/* Solutions */}
            <div className="border-t pt-4">
              <div className="font-bold text-gray-900 mb-2">Solutions</div>
              <div className="space-y-2 pl-4">
                <Link href="/solutions" onClick={handleMenuLinkClick} className="block min-h-11 py-3 text-sm text-gray-700 hover:text-blue-600 font-semibold">
                  Toutes les solutions →
                </Link>
                <Link href="/solutions/ecommerce" onClick={handleMenuLinkClick} className="block min-h-11 py-3 text-sm text-gray-700 hover:text-blue-600">
                  E-commerce
                </Link>
                <Link href="/solutions/marketing" onClick={handleMenuLinkClick} className="block min-h-11 py-3 text-sm text-gray-700 hover:text-blue-600">
                  Marketing
                </Link>
                <Link href="/solutions/branding" onClick={handleMenuLinkClick} className="block min-h-11 py-3 text-sm text-gray-700 hover:text-blue-600">
                  Branding
                </Link>
              </div>
            </div>

            {/* Industries */}
            <div className="border-t pt-4">
              <div className="font-bold text-gray-900 mb-2">Industries</div>
              <div className="space-y-2 pl-4">
                <Link href="/industries/printing" onClick={handleMenuLinkClick} className="block min-h-11 py-3 text-sm text-gray-700 hover:text-blue-600">
                  Printing & POD
                </Link>
                <Link href="/industries/fashion" onClick={handleMenuLinkClick} className="block min-h-11 py-3 text-sm text-gray-700 hover:text-blue-600">
                  Fashion & Luxury
                </Link>
                <Link href="/industries/sports" onClick={handleMenuLinkClick} className="block min-h-11 py-3 text-sm text-gray-700 hover:text-blue-600">
                  Sporting Goods
                </Link>
              </div>
            </div>

            {/* Ressources */}
            <div className="border-t pt-4">
              <Link href="/pricing" onClick={handleMenuLinkClick} className="block min-h-11 py-3 text-gray-900 font-medium hover:text-blue-600">
                Tarifs
              </Link>
              <Link href="/success-stories" onClick={handleMenuLinkClick} className="block min-h-11 py-3 text-gray-900 font-medium hover:text-blue-600">
                Success Stories
              </Link>
              <Link href="/help/documentation" onClick={handleMenuLinkClick} className="block min-h-11 py-3 text-gray-900 font-medium hover:text-blue-600">
                Documentation
              </Link>
            </div>

            {/* CTAs Mobile */}
            <div className="pt-4 border-t space-y-3">
              <Link href="/login" onClick={handleMenuLinkClick} className="block w-full">
                <Button variant="outline" className="w-full min-h-12 h-12 text-base font-medium">
                  Connexion
                </Button>
              </Link>
              <Link href="/register" onClick={handleMenuLinkClick} className="block w-full">
                <Button className="w-full min-h-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-base font-semibold">
                  Essayer gratuitement
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mega Menus */}
      <MegaMenu items={navigation.jeVeux} type="jeVeux" />
      <MegaMenu items={navigation.solutions} type="solutions" />
      <MegaMenu items={navigation.industries} type="industries" />
      <MegaMenu items={navigation.integrations} type="integrations" />
      <MegaMenu items={navigation.resources} type="resources" />
    </nav>
  );
}

const ZakekeStyleNavContentMemo = memo(ZakekeStyleNavContent);

export function ZakekeStyleNav() {
  return (
    <ErrorBoundary componentName="ZakekeStyleNav">
      <ZakekeStyleNavContentMemo />
    </ErrorBoundary>
  );
}
