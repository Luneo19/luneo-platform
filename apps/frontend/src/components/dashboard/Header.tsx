'use client';

import { CreditsDisplay } from '@/components/credits/CreditsDisplay';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ChevronDown,
    Crown,
    HelpCircle,
    LogOut,
    Menu,
    Search,
    Settings,
    User,
    X
} from 'lucide-react';
import Link from 'next/link';
import React, { memo, useCallback, useState } from 'react';
import { logger } from '../../lib/logger';

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
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleMenuToggle = useCallback(() => {
    onMenuToggle?.();
  }, [onMenuToggle]);

  const handleUserMenuToggle = useCallback(() => {
    setShowUserMenu((prev) => !prev);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setShowUserMenu(false);
  }, []);

  const handleLogout = useCallback(async () => {
    setShowUserMenu(false);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      logger.error('Logout error:', error);
      window.location.href = '/login';
    }
  }, []);

  return (
    <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-40">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-300" />
              )}
            </button>

            {/* Page Title */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{title}</h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-gray-400 mt-1">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Center - Search */}
          <div className="hidden md:flex flex-1 max-w-lg mx-4 sm:mx-8">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher designs, projets, équipe..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Actions */}
            {actions}

            {/* Credits Display */}
            <CreditsDisplay variant="inline" />

            {/* Notifications */}
            <NotificationCenter />

            {/* Help */}
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <HelpCircle className="w-5 h-5 text-gray-300" />
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={handleUserMenuToggle}
                className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">EA</span>
                </div>
                <div className="hidden md:block text-left">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-white">Emmanuel A.</span>
                    <Crown className="w-4 h-4 ml-1 text-yellow-500" />
                  </div>
                  <p className="text-xs text-gray-400">Enterprise</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {/* User Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">EA</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Emmanuel Abougadous</p>
                          <p className="text-xs text-gray-400">emmanuel@luneo.app</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-1">
                      <Link 
                        href="/overview" 
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                        onClick={handleCloseMenu}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Mon profil
                      </Link>
                      <Link 
                        href="/dashboard/settings" 
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                        onClick={handleCloseMenu}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Paramètres
                      </Link>
                      <Link 
                        href="/dashboard/billing" 
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                        onClick={handleCloseMenu}
                      >
                        <Crown className="w-4 h-4 mr-3" />
                        Gérer l'abonnement
                      </Link>
                      <div className="border-t border-gray-700 my-1"></div>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Se déconnecter
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
