/**
 * Dashboard Theme Component
 * Palette dark cohérente pour tout le dashboard
 */

'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const DASHBOARD_THEME = {
  // Backgrounds
  bg: {
    primary: 'bg-gray-900',
    secondary: 'bg-gray-800',
    tertiary: 'bg-gray-800/50',
    card: 'bg-gray-800/80',
    hover: 'hover:bg-gray-700',
    active: 'bg-gray-700',
  },
  
  // Text
  text: {
    primary: 'text-white',
    secondary: 'text-gray-300',
    tertiary: 'text-gray-400',
    muted: 'text-gray-500',
  },
  
  // Borders
  border: {
    default: 'border-gray-700',
    hover: 'hover:border-gray-600',
    focus: 'focus:border-blue-500',
  },
  
  // Accents
  accent: {
    blue: 'bg-blue-600 hover:bg-blue-500',
    purple: 'bg-purple-600 hover:bg-purple-500',
    green: 'bg-green-600 hover:bg-green-500',
    red: 'bg-red-600 hover:bg-red-500',
    orange: 'bg-orange-600 hover:bg-orange-500',
  },
  
  // Gradients
  gradient: {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600',
    secondary: 'bg-gradient-to-r from-purple-600 to-pink-600',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600',
  },
};

/**
 * Classes de base pour toutes les pages dashboard
 */
export const DASHBOARD_BASE_CLASSES = {
  page: 'min-h-screen bg-gray-900 text-white',
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
  header: 'mb-6 sm:mb-8',
  title: 'text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2',
  subtitle: 'text-base sm:text-lg text-gray-400',
  card: 'bg-gray-800/80 border border-gray-700 rounded-lg p-4 sm:p-6',
  input: 'bg-gray-900 border-gray-700 text-white placeholder:text-gray-500',
  button: 'bg-blue-600 hover:bg-blue-500 text-white font-semibold',
  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
};

/**
 * Hook pour utiliser le thème dashboard
 */
export function useDashboardTheme() {
  return {
    theme: DASHBOARD_THEME,
    classes: DASHBOARD_BASE_CLASSES,
  };
}

/**
 * Wrapper component pour pages dashboard
 */
function DashboardPageContent({ 
  children, 
  title, 
  subtitle,
  className = '' 
}: { 
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={`${DASHBOARD_BASE_CLASSES.page} ${className}`}>
      <div className={DASHBOARD_BASE_CLASSES.container}>
        {(title || subtitle) && (
          <div className={DASHBOARD_BASE_CLASSES.header}>
            {title && <h1 className={DASHBOARD_BASE_CLASSES.title}>{title}</h1>}
            {subtitle && <p className={DASHBOARD_BASE_CLASSES.subtitle}>{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

const DashboardPageContentMemo = memo(DashboardPageContent);

export function DashboardPage(props: { 
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <ErrorBoundary componentName="DashboardPage">
      <DashboardPageContentMemo {...props} />
    </ErrorBoundary>
  );
}

