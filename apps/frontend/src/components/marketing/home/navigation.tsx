'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  BookOpen,
  BarChart3,
  Plug,
  Headphones,
  ShoppingCart,
  TrendingUp,
  Wrench,
  Megaphone,
  FileText,
  HelpCircle,
  Newspaper,
  Code,
} from 'lucide-react';
import { Logo } from '@/components/Logo';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface MenuItemData {
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

interface DropdownData {
  label: string;
  items: MenuItemData[];
}

const dropdowns: DropdownData[] = [
  {
    label: 'Produit',
    items: [
      {
        label: 'Agents Conversationnels',
        description: 'Déployez des agents IA entraînés sur vos données',
        icon: MessageSquare,
        href: '/product/agents',
      },
      {
        label: 'Base de Connaissances',
        description: 'Indexation vectorielle de vos documents',
        icon: BookOpen,
        href: '/product/knowledge-base',
      },
      {
        label: 'Analytics & Insights',
        description: 'Mesurez la performance de vos agents',
        icon: BarChart3,
        href: '/product/analytics',
      },
      {
        label: 'Intégrations',
        description: 'Connectez Shopify, Slack, Zendesk et plus',
        icon: Plug,
        href: '/product/integrations',
      },
    ],
  },
  {
    label: 'Solutions',
    items: [
      {
        label: 'Service Client',
        description: 'Automatisez 80% des demandes clients',
        icon: Headphones,
        href: '/solutions/customer-service',
      },
      {
        label: 'E-commerce',
        description: 'Assistants shopping et suivi de commandes',
        icon: ShoppingCart,
        href: '/solutions/ecommerce',
      },
      {
        label: 'Ventes',
        description: 'Qualifiez vos leads automatiquement',
        icon: TrendingUp,
        href: '/solutions/sales',
      },
      {
        label: 'Support Technique',
        description: 'Résolution automatisée de tickets',
        icon: Wrench,
        href: '/solutions/technical-support',
      },
      {
        label: 'Marketing',
        description: 'Engagez vos visiteurs en temps réel',
        icon: Megaphone,
        href: '/solutions/marketing',
      },
    ],
  },
  {
    label: 'Ressources',
    items: [
      {
        label: 'Documentation',
        description: 'Guides et tutoriels complets',
        icon: FileText,
        href: '/docs',
      },
      {
        label: "Centre d'aide",
        description: 'FAQ et assistance',
        icon: HelpCircle,
        href: '/help',
      },
      {
        label: 'Blog',
        description: 'Actualités et bonnes pratiques',
        icon: Newspaper,
        href: '/blog',
      },
      {
        label: 'API Docs',
        description: 'Référence API pour développeurs',
        icon: Code,
        href: '/api-docs',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const dropdownVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.98,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

const mobileMenuVariants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: { type: 'spring', damping: 30, stiffness: 300 },
  },
  exit: {
    x: '100%',
    transition: { duration: 0.25, ease: 'easeIn' },
  },
};

const accordionVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

const itemStagger = {
  visible: { transition: { staggerChildren: 0.04 } },
};

const itemChild = {
  hidden: { opacity: 0, x: -6 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
};

// ---------------------------------------------------------------------------
// Mega-menu dropdown panel
// ---------------------------------------------------------------------------

function DropdownPanel({
  data,
  onClose,
}: {
  data: DropdownData;
  onClose: () => void;
}) {
  return (
    <motion.div
      variants={dropdownVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute top-full left-1/2 -translate-x-1/2 pt-3"
    >
      <motion.div
        variants={itemStagger}
        initial="hidden"
        animate="visible"
        className={
          'relative rounded-2xl border border-white/[0.08] bg-[#0c0c1d]/95 ' +
          'backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden ' +
          (data.items.length > 4 ? 'w-[540px]' : 'w-[460px]')
        }
      >
        {/* Gradient top accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        <div className="p-2">
          {data.items.map((item) => (
            <motion.div key={item.label} variants={itemChild}>
              <Link
                href={item.href}
                onClick={onClose}
                className={
                  'group flex items-start gap-4 rounded-xl px-4 py-3 ' +
                  'transition-colors hover:bg-white/[0.04]'
                }
              >
                <div
                  className={
                    'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ' +
                    'bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 ' +
                    'border border-white/[0.06] ' +
                    'group-hover:from-indigo-500/20 group-hover:to-cyan-500/20 ' +
                    'group-hover:border-indigo-500/20 transition-all duration-200'
                  }
                >
                  <item.icon className="h-5 w-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-snug text-white/40 group-hover:text-white/55 transition-colors">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 text-white/0 group-hover:text-white/30 transition-all translate-x-0 group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Mobile accordion section
// ---------------------------------------------------------------------------

function MobileAccordion({
  data,
  onNavigate,
}: {
  data: DropdownData;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/[0.06]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-[15px] font-medium text-white/80"
      >
        {data.label}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-white/40" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            variants={accordionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-0.5">
              {data.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onNavigate}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] border border-white/[0.06]">
                    <item.icon className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">
                      {item.label}
                    </p>
                    <p className="text-xs text-white/35">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Navigation
// ---------------------------------------------------------------------------

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleDropdownEnter = useCallback((label: string) => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setOpenDropdown(label);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    closeTimeout.current = setTimeout(() => setOpenDropdown(null), 150);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      <nav
        className={
          'fixed inset-x-0 top-0 z-50 transition-all duration-500 ' +
          (scrolled
            ? 'bg-[#030014]/80 backdrop-blur-2xl border-b border-white/[0.06]'
            : 'bg-transparent')
        }
      >
        {/* Glow separator */}
        <div
          className={
            'absolute inset-x-0 bottom-0 h-px transition-opacity duration-500 ' +
            'bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent ' +
            (scrolled ? 'opacity-100' : 'opacity-0')
          }
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between lg:h-[68px]">
            {/* ---- Left: Logo ---- */}
            <Logo href="/" size="default" showText variant="dark" />

            {/* ---- Center: Nav links (desktop) ---- */}
            <div className="hidden lg:flex items-center gap-1">
              {dropdowns.map((dd) => (
                <div
                  key={dd.label}
                  className="relative"
                  onMouseEnter={() => handleDropdownEnter(dd.label)}
                  onMouseLeave={handleDropdownLeave}
                >
                  <button
                    type="button"
                    className={
                      'group flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ' +
                      (openDropdown === dd.label
                        ? 'text-white bg-white/[0.04]'
                        : 'text-white/60 hover:text-white/90')
                    }
                  >
                    {dd.label}
                    <ChevronDown
                      className={
                        'h-3.5 w-3.5 transition-transform duration-200 ' +
                        (openDropdown === dd.label
                          ? 'rotate-180 text-indigo-400'
                          : 'text-white/30 group-hover:text-white/50')
                      }
                    />
                  </button>

                  <AnimatePresence>
                    {openDropdown === dd.label && (
                      <DropdownPanel
                        data={dd}
                        onClose={() => setOpenDropdown(null)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* Tarifs – direct link */}
              <Link
                href="/pricing"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white/90"
              >
                Tarifs
              </Link>
            </div>

            {/* ---- Right: CTAs (desktop) ---- */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/login"
                className={
                  'rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium ' +
                  'text-white/70 transition-all hover:text-white hover:border-white/[0.15] hover:bg-white/[0.04]'
                }
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                className={
                  'relative rounded-lg px-5 py-2 text-sm font-semibold text-white ' +
                  'bg-gradient-to-r from-indigo-500 to-cyan-500 ' +
                  'shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.45)] ' +
                  'transition-shadow duration-300'
                }
              >
                Essai gratuit
              </Link>
            </div>

            {/* ---- Hamburger (mobile) ---- */}
            <button
              type="button"
              className="lg:hidden relative z-50 flex h-10 w-10 items-center justify-center rounded-lg text-white/80 hover:bg-white/[0.06] transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.div
                    key="close"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </nav>

      {/* ---- Mobile side panel ---- */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={closeMobile}
            />

            {/* Panel */}
            <motion.aside
              key="mobile-panel"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={
                'fixed inset-y-0 right-0 z-40 w-full max-w-sm lg:hidden ' +
                'bg-[#0a0a1a]/98 backdrop-blur-2xl border-l border-white/[0.06] ' +
                'flex flex-col overflow-y-auto'
              }
            >
              {/* Header spacer */}
              <div className="h-16 shrink-0" />

              {/* Accordion menus */}
              <div className="flex-1">
                {dropdowns.map((dd) => (
                  <MobileAccordion
                    key={dd.label}
                    data={dd}
                    onNavigate={closeMobile}
                  />
                ))}

                {/* Tarifs link */}
                <Link
                  href="/pricing"
                  onClick={closeMobile}
                  className="flex items-center px-5 py-4 text-[15px] font-medium text-white/80 border-b border-white/[0.06] transition-colors hover:text-white"
                >
                  Tarifs
                </Link>
              </div>

              {/* Bottom CTAs */}
              <div className="shrink-0 border-t border-white/[0.06] p-5 space-y-3">
                <Link
                  href="/login"
                  onClick={closeMobile}
                  className={
                    'flex w-full items-center justify-center rounded-xl border border-white/[0.1] ' +
                    'py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.04] hover:text-white'
                  }
                >
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  onClick={closeMobile}
                  className={
                    'flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold text-white ' +
                    'bg-gradient-to-r from-indigo-500 to-cyan-500 ' +
                    'shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                  }
                >
                  Essai gratuit
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
