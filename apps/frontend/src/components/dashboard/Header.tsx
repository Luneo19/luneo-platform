'use client';

import { CreditsDisplay } from '@/components/credits/CreditsDisplay';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { GlobalSearch } from '@/components/dashboard/GlobalSearch';
import { useDensity } from '@/providers/DensityProvider';
import { useIsAuthenticated } from '@/lib/hooks/useAuth';
import { endpoints } from '@/lib/api/client';
import { appRoutes } from '@/lib/routes';
import { logger } from '../../lib/logger';
import { useI18n } from '@/i18n/useI18n';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Crown,
  HelpCircle,
  LogOut,
  Menu,
  Settings,
  User,
  X
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';
import React, { memo, useCallback, useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

const Header = memo(function Header({
  title,
  subtitle,
  actions,
  onMenuToggle,
  isMobileMenuOpen
}: HeaderProps) {
  const { user } = useIsAuthenticated();
  const { density, setDensity } = useDensity();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { t } = useI18n();

  const handleUserMenuToggle = useCallback(() => {
    setShowUserMenu((prev) => !prev);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setShowUserMenu(false);
  }, []);

  const handleLogout = useCallback(async () => {
    setShowUserMenu(false);
    try {
      await endpoints.auth.logout();
    } catch (error) {
      logger.error('Logout error', { error });
    } finally {
      window.location.href = '/login';
    }
  }, []);

  return (
    <header className="dash-header sticky top-0 z-40">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg transition-colors"
              aria-label={isMobileMenuOpen ? t('dashboard.header.closeMenu') || 'Fermer le menu' : t('dashboard.header.openMenu') || 'Ouvrir le menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-sidebar-menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-600 dark:text-white/70" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600 dark:text-white/70" aria-hidden="true" />
              )}
            </button>

            {/* Page Title */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h2>
              {subtitle && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Center - Global search */}
          <div className="hidden md:flex flex-1 max-w-lg mx-4 sm:mx-8">
            <GlobalSearch />
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Actions */}
            {actions}

            {/* Credits Display */}
            <CreditsDisplay userId={user?.id || ''} inline />

            {/* Notifications */}
            <NotificationCenter />

            {/* Density Toggle */}
            <div className="hidden md:flex items-center bg-black/[0.03] dark:bg-white/[0.04] rounded-lg p-0.5 border border-black/[0.06] dark:border-white/[0.06]" role="group" aria-label={t('dashboard.header.densityLabel') || 'Densité de l\'interface'}>
              {(['compact', 'comfortable'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDensity(mode)}
                  className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all ${
                    density === mode
                      ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 shadow-sm'
                      : 'text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white'
                  }`}
                  aria-pressed={density === mode}
                  aria-label={mode === 'compact' ? t('dashboard.header.densityCompact') : t('dashboard.header.densityComfort')}
                >
                  {mode === 'compact' ? t('dashboard.header.densityCompact') : t('dashboard.header.densityComfort')}
                </button>
              ))}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Help */}
            <button className="p-2 hover:bg-accent rounded-lg transition-colors" aria-label={t('dashboard.header.help') || 'Aide'}>
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Plan badge */}
            <span className="dash-badge dash-badge-pro">PRO</span>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={handleUserMenuToggle}
                className="flex items-center space-x-2 p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg transition-colors"
                aria-label={t('dashboard.header.userMenu') || 'Menu utilisateur'}
                aria-expanded={showUserMenu}
                aria-haspopup="menu"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white font-medium text-sm">
                    {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '??'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-foreground">{user?.name || t('dashboard.header.user')}</span>
                    <Crown className="w-4 h-4 ml-1 text-yellow-500" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              </button>

              {/* User Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a1a2e] rounded-xl shadow-2xl border border-black/[0.08] dark:border-white/[0.08] backdrop-blur-xl py-2 z-50"
                    role="menu"
                    aria-label={t('dashboard.header.userMenu') || 'Menu utilisateur'}
                  >
                    <div className="px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-white font-medium">
                            {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '??'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{user?.name || t('dashboard.header.user')}</p>
                          <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                        </div>
                      </div>
                    </div>

                    <div className="py-1" role="none">
                      <Link
                        href={appRoutes.overview}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-white/85 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors"
                        onClick={handleCloseMenu}
                        role="menuitem"
                      >
                        <User className="w-4 h-4 mr-3" aria-hidden="true" />
                        {t('dashboard.header.myProfile')}
                      </Link>
                      <Link
                        href={appRoutes.settings}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-white/85 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors"
                        onClick={handleCloseMenu}
                        role="menuitem"
                      >
                        <Settings className="w-4 h-4 mr-3" aria-hidden="true" />
                        {t('common.settings')}
                      </Link>
                      <Link
                        href={appRoutes.billing}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-white/85 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors"
                        onClick={handleCloseMenu}
                        role="menuitem"
                      >
                        <Crown className="w-4 h-4 mr-3" aria-hidden="true" />
                        {t('dashboard.header.manageSubscription')}
                      </Link>
                      <div className="border-t border-black/[0.06] dark:border-white/[0.06] my-1" role="separator"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4 mr-3" aria-hidden="true" />
                        {t('dashboard.header.logout')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export { Header };
