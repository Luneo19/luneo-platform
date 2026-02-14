'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  X,
  Palette,
  Box,
  Glasses,
  Printer,
  Sparkles,
  Package,
  ShoppingCart,
  Megaphone,
  Fingerprint,
  Share2,
  BookOpen,
  HelpCircle,
  Users,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { AnimatedBorderCTA } from '@/components/ui/animated-border';

// =============================================================================
// MEGA-MENU DATA
// =============================================================================

const MENU_DATA = {
  product: {
    label: 'Produit',
    columns: [
      {
        title: 'Personnalisation',
        items: [
          { href: '/features', label: 'Customizer 2D', description: 'Editeur visuel drag-and-drop', icon: Palette },
          { href: '/features#3d', label: 'Configurateur 3D', description: 'Visualisation temps reel Three.js', icon: Box },
          { href: '/features#ar', label: 'Virtual Try-On AR', description: 'Essayage augmente en direct', icon: Glasses },
        ],
      },
      {
        title: 'Production',
        items: [
          { href: '/features#export', label: 'Export Print-Ready', description: 'CMYK, PDF/X-4, haute resolution', icon: Printer },
          { href: '/features#ai', label: 'AI Studio', description: 'Generation par intelligence artificielle', icon: Sparkles },
          { href: '/features#products', label: 'Gestion Produits', description: 'Catalogue et variantes', icon: Package },
        ],
      },
    ],
    cta: { href: '/demo', label: 'Voir la demo', description: 'Testez toutes les fonctionnalites' },
  },
  solutions: {
    label: 'Solutions',
    columns: [
      {
        title: 'Par secteur',
        items: [
          { href: '/solutions/ecommerce', label: 'E-commerce', description: 'Personnalisation a grande echelle', icon: ShoppingCart },
          { href: '/solutions/marketing', label: 'Marketing', description: 'Campagnes visuelles uniques', icon: Megaphone },
          { href: '/solutions/branding', label: 'Branding', description: 'Identite de marque coherente', icon: Fingerprint },
          { href: '/solutions/social', label: 'Social Media', description: 'Contenu optimise reseaux', icon: Share2 },
        ],
      },
    ],
    cta: { href: '/integrations-overview', label: 'Integrations', description: 'Shopify, WooCommerce, API...' },
  },
  resources: {
    label: 'Ressources',
    columns: [
      {
        title: 'Apprendre',
        items: [
          { href: '/help/documentation', label: 'Documentation', description: 'Guides et references API', icon: BookOpen },
          { href: '/help', label: "Centre d'aide", description: 'FAQ et support technique', icon: HelpCircle },
          { href: '/community', label: 'Communaute', description: 'Echangez avec les utilisateurs', icon: Users },
          { href: '/contact', label: 'Contact', description: 'Equipe commerciale et support', icon: Mail },
        ],
      },
    ],
    cta: { href: '/register', label: 'Commencer gratuitement', description: 'Essai gratuit 14 jours' },
  },
} as const;

type MenuKey = keyof typeof MENU_DATA;

// =============================================================================
// NAVIGATION COMPONENT
// =============================================================================

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null);
  const [mobileAccordion, setMobileAccordion] = useState<MenuKey | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const openMenu = useCallback((key: MenuKey) => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    setActiveMenu(key);
  }, []);

  const startClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => setActiveMenu(null), 200);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
  }, []);

  const closeAll = useCallback(() => {
    setActiveMenu(null);
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
  }, []);

  return (
    <>
      {/* ================================================================= */}
      {/* NAVBAR */}
      {/* ================================================================= */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 ${
          scrolled
            ? 'bg-dark-bg/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        {/* Subtle glow line under navbar on scroll */}
        {scrolled && (
          <div className="absolute bottom-0 left-0 right-0 h-px glow-separator" />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <Logo variant="dark" size="default" href="/" onClick={closeAll} />

            {/* Desktop Nav Items */}
            <div className="hidden lg:flex items-center gap-1">
              {(Object.keys(MENU_DATA) as MenuKey[]).map((key) => (
                <div
                  key={key}
                  onMouseEnter={() => openMenu(key)}
                  onMouseLeave={startClose}
                >
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                      activeMenu === key
                        ? 'text-white bg-white/[0.08]'
                        : 'text-white/90 hover:text-white hover:bg-white/[0.04]'
                    }`}
                    aria-expanded={activeMenu === key}
                    aria-haspopup="menu"
                    aria-label={`${MENU_DATA[key].label}${activeMenu === key ? ', ouvert' : ''}`}
                  >
                    {MENU_DATA[key].label}
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        activeMenu === key ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
              ))}

              <Link
                href="/pricing"
                className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/[0.04] rounded-lg transition-all duration-200"
                onClick={closeAll}
              >
                Tarifs
              </Link>
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/login" onClick={closeAll}>
                <AnimatedBorderCTA speed="normal" variant="white">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white bg-transparent hover:bg-transparent font-medium border-0"
                  >
                    Connexion
                  </Button>
                </AnimatedBorderCTA>
              </Link>
              <Link href="/register" onClick={closeAll}>
                <AnimatedBorderCTA speed="normal">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  >
                    Essai gratuit
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </AnimatedBorderCTA>
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-white/[0.06] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-panel"
            >
              <div className="w-5 h-5 relative">
                <span
                  className={`absolute left-0 w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${
                    mobileOpen ? 'top-[9px] rotate-45' : 'top-1'
                  }`}
                />
                <span
                  className={`absolute left-0 top-[9px] w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${
                    mobileOpen ? 'opacity-0 scale-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`absolute left-0 w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${
                    mobileOpen ? 'top-[9px] -rotate-45' : 'top-[17px]'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* ================================================================= */}
      {/* MEGA-MENU PANEL (Desktop) */}
      {/* ================================================================= */}
      <div
        className={`fixed top-[72px] left-0 right-0 z-[999] transition-all duration-250 ease-out ${
          activeMenu
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
        onMouseEnter={cancelClose}
        onMouseLeave={startClose}
      >
        <div className="h-1" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-dark-card/95 backdrop-blur-xl rounded-2xl border border-white/[0.06] shadow-2xl shadow-black/40 overflow-hidden">
            {activeMenu && (
              <div className="p-8">
                <div className="flex gap-8">
                  {/* Columns */}
                  <div className="flex-1 flex gap-8">
                    {MENU_DATA[activeMenu].columns.map((col, ci) => (
                      <div key={ci} className="flex-1">
                        <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
                          {col.title}
                        </h4>
                        <div className="space-y-1">
                          {col.items.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={closeAll}
                                className="group flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-150"
                              >
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center shrink-0 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-colors">
                                  <Icon className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                                    {item.label}
                                  </div>
                                  <div className="text-xs text-white/80 mt-0.5 leading-relaxed">
                                    {item.description}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA sidebar */}
                  <div className="w-56 shrink-0 bg-gradient-to-br from-purple-500/10 via-fuchsia-500/10 to-pink-500/10 border border-white/[0.04] rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1.5">
                        {MENU_DATA[activeMenu].cta.label}
                      </h4>
                      <p className="text-xs text-white/80 leading-relaxed">
                        {MENU_DATA[activeMenu].cta.description}
                      </p>
                    </div>
                    <Link href={MENU_DATA[activeMenu].cta.href} onClick={closeAll}>
                      <Button
                        size="sm"
                        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md shadow-purple-500/20 text-xs font-semibold"
                      >
                        Decouvrir
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay to close mega-menu on click outside */}
      {activeMenu && <div className="fixed inset-0 z-[998]" onClick={closeAll} />}

      {/* ================================================================= */}
      {/* MOBILE MENU */}
      {/* ================================================================= */}
      <div
        className={`fixed inset-0 z-[999] lg:hidden transition-all duration-300 ${
          mobileOpen ? 'visible' : 'invisible pointer-events-none'
        }`}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Panel */}
        <div
          id="mobile-nav-panel"
          className={`absolute top-0 right-0 w-full max-w-sm h-full bg-dark-bg border-l border-white/[0.06] shadow-2xl transition-transform duration-300 ease-out overflow-y-auto ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          role="navigation"
          aria-label="Menu de navigation"
        >
          {/* Mobile header */}
          <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
            <Logo variant="dark" size="small" href="/" onClick={() => setMobileOpen(false)} />
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5 text-white" aria-hidden />
            </button>
          </div>

          {/* Accordion sections */}
          <div className="p-4 space-y-1">
            {(Object.keys(MENU_DATA) as MenuKey[]).map((key) => (
              <div key={key}>
                <button
                  onClick={() => setMobileAccordion(mobileAccordion === key ? null : key)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-white/[0.04] transition-colors"
                  aria-expanded={mobileAccordion === key}
                  aria-controls={`mobile-accordion-${key}`}
                >
                  <span className="text-sm font-semibold text-white">
                    {MENU_DATA[key].label}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-white/70 transition-transform duration-200 ${
                      mobileAccordion === key ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                <div
                  id={`mobile-accordion-${key}`}
                  className={`overflow-hidden transition-all duration-200 ${
                    mobileAccordion === key ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="pl-3 pb-2 space-y-0.5">
                    {MENU_DATA[key].columns.flatMap((col) =>
                      col.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                          >
                            <Icon className="w-4 h-4 text-purple-400 shrink-0" />
                            <div>
                              <div className="text-sm font-medium text-white">{item.label}</div>
                              <div className="text-xs text-white/80">{item.description}</div>
                            </div>
                          </Link>
                        );
                      }),
                    )}
                  </div>
                </div>
              </div>
            ))}

            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="flex items-center px-3 py-3 rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              <span className="text-sm font-semibold text-white">Tarifs</span>
            </Link>
          </div>

          {/* Mobile CTA */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-dark-bg/95 backdrop-blur-sm border-t border-white/[0.06] space-y-2">
            <Link href="/login" onClick={() => setMobileOpen(false)} className="block">
              <Button variant="outline" className="w-full font-medium text-white border-white/[0.15] bg-white/[0.06] hover:bg-white/[0.1] hover:text-white">
                Connexion
              </Button>
            </Link>
            <Link href="/register" onClick={() => setMobileOpen(false)} className="block">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold">
                Essai gratuit
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
