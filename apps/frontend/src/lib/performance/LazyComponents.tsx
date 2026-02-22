'use client';

/**
 * Lazy Loaded Components
 * P-006: Lazy loading pour composants 3D/AR
 */

import dynamic from 'next/dynamic';
import { Suspense, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { logger } from '../logger';
import { useI18n } from '@/i18n/useI18n';

// Loading fallback components
const LoadingSpinner = ({ message }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
    <p className="text-sm text-slate-400">{message}</p>
  </div>
);

/** Wrapper that uses i18n for the loading message (used in dynamic() loading option). */
function LoadingWithI18n({ messageKey }: { messageKey: string }) {
  const { t } = useI18n();
  return <LoadingSpinner message={t(messageKey)} />;
}

function Loading3DWithI18n() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[400px] bg-slate-900/50 rounded-lg">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full animate-pulse" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-t-blue-500 rounded-full animate-spin" />
      </div>
      <p className="mt-4 text-sm text-slate-400">{t('common.loadingViewer')}</p>
    </div>
  );
}

function LoadingARWithI18n() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[400px] bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg">
      <div className="w-20 h-20 relative">
        <div className="absolute inset-0 border-2 border-purple-500/50 rounded-lg animate-pulse" />
        <div className="absolute inset-2 border-2 border-blue-500/50 rounded-lg animate-pulse delay-75" />
        <div className="absolute inset-4 border-2 border-cyan-500/50 rounded-lg animate-pulse delay-150" />
      </div>
      <p className="mt-4 text-sm text-slate-400">{t('common.loadingAR')}</p>
    </div>
  );
}

function LoadingCanvasWithI18n() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[500px] bg-slate-800/30 rounded-lg border border-slate-700/50">
      <div className="grid grid-cols-3 gap-2">
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className="w-4 h-4 bg-slate-600 rounded animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-400">{t('common.loadingEditor')}</p>
    </div>
  );
}

// V1 3D/AR components removed — stubs for backward compatibility
export const LazyThreeViewer = (() => null) as unknown as React.ComponentType;
export const LazyARViewer = (() => null) as unknown as React.ComponentType;
export const LazyCanvasEditor = (() => null) as unknown as React.ComponentType;

export const LazyProductCustomizer = dynamic(
  () => import('@/components/ProductCustomizer').then(mod => mod.default || mod),
  {
    loading: () => <LoadingWithI18n messageKey="common.loadingCustomizer" />,
    ssr: false,
  }
);

export const LazyTemplateGallery = dynamic(
  () => import('@/components/TemplateGallery').then(mod => mod.default || mod),
  {
    loading: () => <LoadingWithI18n messageKey="common.loadingTemplates" />,
  }
);

export const LazyClipartBrowser = dynamic(
  () => import('@/components/ClipartBrowser').then(mod => mod.default || mod),
  {
    loading: () => <LoadingWithI18n messageKey="common.loadingCliparts" />,
  }
);

// Analytics components (heavy charts)
export const LazyAnalyticsDashboard = dynamic(
  () => import('@/components/dashboard/AnalyticsDashboard').then(mod => mod.default || mod),
  {
    loading: () => <LoadingWithI18n messageKey="common.loadingAnalytics" />,
  }
);

// AI Studio components
export const LazyAIStudio = dynamic(
  () => import('@/components/ai/AIStudio').then(mod => mod.default || mod),
  {
    loading: () => <LoadingWithI18n messageKey="common.loadingAIStudio" />,
  }
);

/**
 * Wrapper component for lazy loaded components with error boundary
 */
interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function LazyWrapper({ children, fallback }: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback ?? <LoadingWithI18n messageKey="common.loading" />}>
      {children}
    </Suspense>
  );
}

/**
 * Preload component (call when you know the user will need it)
 */
export function preloadComponent(componentName: string): void {
  switch (componentName) {
    case 'ProductCustomizer':
      import('@/components/ProductCustomizer');
      break;
    default:
      logger.warn(`Unknown component to preload: ${componentName}`);
  }
}

export {
  LoadingSpinner,
  LoadingWithI18n,
  Loading3DWithI18n as Loading3D,
  LoadingARWithI18n as LoadingAR,
  LoadingCanvasWithI18n as LoadingCanvas,
};

