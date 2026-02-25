'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import {
  Search,
  Settings,
  User,
  ChevronDown,
  Zap,
  Crown,
  CreditCard,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { LocaleSwitcher } from '@/components/navigation/LocaleSwitcher';
import { useTranslations } from '@/i18n/useI18n';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuth } from '@/hooks/useAuth';
import { appRoutes } from '@/lib/routes';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

function HeaderContent({ title, subtitle }: HeaderProps) {
  const t = useTranslations('header');
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Derive display values from real user data
  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : '';
  const initials = user
    ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'
    : '?';
  const displayEmail = user?.email || '';

  const toggleProfile = useCallback(() => {
    setIsProfileOpen((prev) => !prev);
  }, []);

  const closeProfile = useCallback(() => {
    setIsProfileOpen(false);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <header className="bg-card border-b border-border px-6 py-4 text-foreground transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-6">
          {/* Breadcrumb */}
          <div>
            {title && <h1 className="text-xl font-semibold text-foreground">{title}</h1>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="mx-8 flex-1 max-w-md">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-4"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          <div className="hidden items-center gap-2 md:flex">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              aria-label={t('actions.create')}
            >
              <Zap className="h-4 w-4" aria-hidden="true" />
              <span>{t('actions.create')}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              aria-label={t('actions.upgrade')}
            >
              <Crown className="h-4 w-4" aria-hidden="true" />
              <span>{t('actions.upgrade')}</span>
            </Button>
          </div>
          <LocaleSwitcher className="hidden lg:block" />
          <ThemeToggle />

          {/* Notifications - Real-time (WebSocket/backend) */}
          <NotificationBell variant="ghost" size="md" />

          {/* Profile Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={toggleProfile}
              className="flex h-10 items-center gap-2 px-3"
              aria-haspopup="menu"
              aria-expanded={isProfileOpen}
              aria-label={t('profileMenu.openLabel')}
              data-testid="user-menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/70 text-sm font-medium text-white">
                {initials}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{t('profileMenu.plan')}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </Button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  role="menu"
                  aria-label={t('profileMenu.openLabel')}
                  className="absolute right-0 mt-2 w-64 rounded-lg border border-border bg-popover shadow-lg focus-visible:outline-none"
                >
                  <div className="border-b border-border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/70 text-white">
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {t('profileMenu.welcome')} {displayName}
                        </p>
                        <p className="text-sm text-muted-foreground">{displayEmail}</p>
                        <div className="mt-1 flex items-center gap-1 text-primary">
                          <Crown className="h-3 w-3" aria-hidden="true" />
                          <span className="text-xs">{t('profileMenu.plan')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <Link href="/profile">
                      <div className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent/50">
                        <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <span>{t('profileMenu.profile')}</span>
                      </div>
                    </Link>
                    
                    <Link href={appRoutes.billing}>
                      <div className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent/50">
                        <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <span>{t('profileMenu.billing')}</span>
                      </div>
                    </Link>
                    
                    <Link href={appRoutes.settings}>
                      <div className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent/50">
                        <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <span>{t('profileMenu.settings')}</span>
                      </div>
                    </Link>
                    
                    <Link href="/help/documentation">
                      <div className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent/50">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <span>{t('profileMenu.help')}</span>
                      </div>
                    </Link>

                    <div className="px-4 py-2">
                      <LocaleSwitcher className="w-full" />
                    </div>
                    
                    <div className="my-2 border-t border-border" />
                    
                    <Link href={appRoutes.integrations}>
                      <div className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent/50">
                        <span className="flex h-4 w-4 items-center justify-center text-muted-foreground" aria-hidden="true">
                          🌐
                        </span>
                        <span>{t('profileMenu.api')}</span>
                      </div>
                    </Link>
                    
                    <div className="my-2 border-t border-border" />
                    
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-danger transition-colors hover:bg-accent/30"
                      onClick={closeProfile}
                      data-testid="logout-button"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      <span>{t('profileMenu.logout')}</span>
                    </button>
                  </div>
                </motion>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

const HeaderContentMemo = memo(HeaderContent);

export function Header(props: HeaderProps) {
  return (
    <ErrorBoundary componentName="Header">
      <HeaderContentMemo {...props} />
    </ErrorBoundary>
  );
}