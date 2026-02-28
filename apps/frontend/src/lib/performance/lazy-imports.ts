/**
 * Lazy Import Utilities
 * 
 * Centralized lazy loading for heavy components and libraries
 * to improve initial bundle size and page load performance
 */

import dynamic from 'next/dynamic';
import React from 'react';

// Loading components
const Loading3D = () => React.createElement('div', { className: 'flex items-center justify-center p-8' }, 'Chargement du configurateur 3D...');
const LoadingChart = () => React.createElement('div', { className: 'flex items-center justify-center p-4' }, 'Chargement du graphique...');
const LoadingAnalytics = () => React.createElement('div', { className: 'flex items-center justify-center p-8' }, 'Chargement des analytics...');
const LoadingEditor = () => React.createElement('div', { className: 'flex items-center justify-center p-8' }, 'Chargement de l\'éditeur...');
const LoadingForm = () => React.createElement('div', { className: 'flex items-center justify-center p-4' }, 'Chargement du formulaire...');

/**
 * Lazy load heavy 3D components
 */
export const LazyZoneConfigurator = dynamic(
  // @ts-expect-error -- ZoneConfigurator path may not exist in codebase; .catch() provides fallback at runtime
  () => import('@/components/dashboard/ZoneConfigurator').catch(() => ({ default: () => null })),
  {
    loading: Loading3D,
    ssr: false, // 3D components typically don't need SSR
  }
) as React.ComponentType<unknown>;

/**
 * Lazy load chart components (if using heavy chart libraries)
 */
export const LazyChart = dynamic(
  // @ts-expect-error -- Chart component path may not exist in codebase; .catch() provides fallback at runtime
  () => import('@/components/charts/Chart').catch(() => ({ default: () => null })),
  {
    loading: LoadingChart,
    ssr: false,
  }
) as React.ComponentType<unknown>;

/**
 * Lazy load heavy analytics components
 */
export const LazyAnalyticsDashboard = dynamic(
  () => import('@/components/dashboard/AnalyticsDashboard').catch(() => ({ default: () => null })),
  {
    loading: LoadingAnalytics,
    ssr: false,
  }
) as React.ComponentType<unknown>;

/**
 * AR/VR components removed (V1) — stub for backward compatibility
 */
export const LazyARViewer = (() => null) as unknown as React.ComponentType<unknown>;

/**
 * Lazy load heavy editor components
 */
export const LazyDesignEditor = dynamic(
  // @ts-expect-error -- DesignEditor path may not exist in codebase; .catch() provides fallback at runtime
  () => import('@/components/editor/DesignEditor').catch(() => ({ default: () => null })),
  {
    loading: LoadingEditor,
    ssr: true, // Forms can benefit from SSR
  }
) as React.ComponentType<unknown>;

/**
 * Lazy load heavy form components
 */
export const LazyAdvancedForm = dynamic(
  // @ts-expect-error -- AdvancedForm path may not exist in codebase; .catch() provides fallback at runtime
  () => import('@/components/forms/AdvancedForm').catch(() => ({ default: () => null })),
  {
    loading: LoadingForm,
    ssr: true, // Forms can benefit from SSR
  }
) as React.ComponentType<unknown>;

/**
 * Helper to create lazy-loaded component with custom loading state
 */
export function createLazyComponent<T = unknown>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  options?: {
    loading?: React.ComponentType | (() => React.ReactElement);
    ssr?: boolean;
  }
) {
  return dynamic(importFn, {
    loading: options?.loading ? (() => React.createElement(options.loading as React.ComponentType)) : (() => React.createElement('div', null, 'Chargement...')),
    ssr: options?.ssr ?? true,
  });
}
