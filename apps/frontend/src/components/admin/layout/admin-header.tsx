/**
 * ★★★ ADMIN HEADER ★★★
 * Header pour le Super Admin Dashboard
 * Breadcrumbs, date picker, search (Command Palette), notifications
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { AdminBreadcrumbs } from './admin-breadcrumbs';
import { Search, Bell, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { AdminUser } from '@/lib/admin/permissions';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { CommandPalette } from '../command-palette';
import { NotificationsPanel } from '../notifications-panel';

interface AdminHeaderProps {
  user: AdminUser;
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await endpoints.auth.logout();
      router.push('/login');
    } catch (error) {
      logger.error('Logout error', { error });
      router.push('/login');
    }
  };

  return (
    <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6">
      {/* Left: Breadcrumbs */}
      <div className="flex-1">
        <AdminBreadcrumbs />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <button
          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          onClick={() => setCommandPaletteOpen(true)}
          aria-label="Open search"
        >
          <Search className="w-4 h-4" />
          <span className="hidden md:inline">{t('admin.sidebar.search')}</span>
          <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-zinc-500 bg-zinc-800 border border-zinc-700 rounded">
            <span>⌘</span>K
          </kbd>
        </button>

        {/* Notifications */}
        <NotificationsPanel userId={user?.id ?? ''} />

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-white">
              {user?.email?.split('@')[0] ?? 'User'}
            </span>
            <span className="text-xs text-zinc-500">{t('admin.sidebar.superAdmin')}</span>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title={t('admin.sidebar.logout')}
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </header>
  );
}
