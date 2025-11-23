import React from 'react';
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { logger } from '@/lib/logger';

// Interface pour les composants lazy
interface LazyComponentProps {
  fallback?: ComponentType;
  ssr?: boolean;
}

// Composant de fallback par défaut
const DefaultFallback = () => (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner size="lg" />
  </div>
);

// Helper pour créer des imports dynamiques optimisés
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentProps = {}
): T => {
  const { fallback = DefaultFallback, ssr = false } = options;

  return dynamic(importFn, {
    loading: () => React.createElement(fallback),
    ssr,
  }) as T;
};

// Imports dynamiques pour les pages principales
export const LazyDashboard = createLazyComponent(
  () => import('@/app/(dashboard)/overview/page'),
  { ssr: false }
);

export const LazyAIStudio = createLazyComponent(
  () => import('@/app/(dashboard)/ai-studio/page'),
  { ssr: false }
);

export const LazyAnalytics = createLazyComponent(
  () => import('@/app/(dashboard)/analytics/page'),
  { ssr: false }
);

export const LazyProducts = createLazyComponent(
  () => import('@/app/(dashboard)/products/page'),
  { ssr: false }
);

export const LazyBilling = createLazyComponent(
  () => import('@/app/(dashboard)/billing/page'),
  { ssr: false }
);

export const LazyTeam = createLazyComponent(
  () => import('@/app/(dashboard)/team/page'),
  { ssr: false }
);

export const LazyIntegrations = createLazyComponent(
  () => import('@/app/(dashboard)/integrations-dashboard/page'),
  { ssr: false }
);

// Imports dynamiques pour les composants lourds

// 3D Components (très lourds: Three.js ~500KB)
export const LazyProductConfigurator3D = createLazyComponent(
  () => import('@/components/3d-configurator/ProductConfigurator3D'),
  { ssr: false }
);

export const LazyThreeViewer = createLazyComponent(
  () => import('@/components/ThreeViewer'),
  { ssr: false }
);

// 2D Customizer (lourd: Konva.js ~300KB)
export const LazyProductCustomizer = createLazyComponent(
  () => import('@/components/Customizer/ProductCustomizer').then(mod => ({ default: mod.ProductCustomizer })),
  { ssr: false }
);

// AR Components (très lourds: AR libraries ~400KB)
export const LazyViewInAR = createLazyComponent(
  () => import('@/components/ar/ViewInAR').then(mod => ({ default: mod.ViewInAR })),
  { ssr: false }
);

export const LazyARScreenshot = createLazyComponent(
  () => import('@/components/ar/ARScreenshot').then(mod => ({ default: mod.ARScreenshot })),
  { ssr: false }
);

// Charts (lourd: Recharts ~200KB) - Commenté car fichier n'existe pas encore
// export const LazyCharts = createLazyComponent(
//   () => import('@/components/charts/ChartContainer'),
//   { ssr: false }
// );

// Galleries (composants images multiples)
export const LazyClipartBrowser = createLazyComponent(
  () => import('@/components/ClipartBrowser').then(mod => ({ default: mod.ClipartBrowser })),
  { ssr: false }
);

export const LazyTemplateGallery = createLazyComponent(
  () => import('@/components/TemplateGallery').then(mod => ({ default: mod.TemplateGallery })),
  { ssr: false }
);

// Imports dynamiques pour les modales
// export const LazyModal = createLazyComponent(
//   () => import('@/components/modals/Modal'),
//   { ssr: false }
// );

// export const LazyDrawer = createLazyComponent(
//   () => import('@/components/modals/Drawer'),
//   { ssr: false }
// );

// Imports dynamiques pour les composants de formulaire complexes
// export const LazyRichTextEditor = createLazyComponent(
//   () => import('@/components/forms/RichTextEditor'),
//   { ssr: false }
// );

// export const LazyDatePicker = createLazyComponent(
//   () => import('@/components/forms/DatePicker'),
//   { ssr: false }
// );

// export const LazyColorPicker = createLazyComponent(
//   () => import('@/components/forms/ColorPicker'),
//   { ssr: false }
// );

// Imports dynamiques pour les composants de visualisation
// export const Lazy3DViewer = createLazyComponent(
//   () => import('@/components/viewers/3DViewer'),
//   { ssr: false }
// );

// export const LazyPDFViewer = createLazyComponent(
//   () => import('@/components/viewers/PDFViewer'),
//   { ssr: false }
// );

// Hook pour précharger les composants
export const usePreloadComponent = () => {
  const preload = (importFn: () => Promise<any>) => {
    // Précharger le composant en arrière-plan
    importFn().catch((error) => {
      logger.warn('Failed to preload component', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    });
  };

  const preloadRoute = (route: string) => {
    // Précharger une route spécifique
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  };

  const preloadOnHover = (element: HTMLElement, importFn: () => Promise<any>) => {
    let hasPreloaded = false;
    
    const handleMouseEnter = () => {
      if (!hasPreloaded) {
        preload(importFn);
        hasPreloaded = true;
      }
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
    };
  };

  return {
    preload,
    preloadRoute,
    preloadOnHover,
  };
};

// Configuration des bundles optimisés
export const bundleConfig = {
  // Composants critiques (chargés immédiatement)
  critical: [
    'components/ui/button',
    'components/ui/input',
    'components/ui/card',
    'components/layout/header',
    'components/layout/sidebar',
  ],
  
  // Composants de dashboard (chargés après login)
  dashboard: [
    'components/dashboard/stats-cards',
    'components/dashboard/quick-actions',
    'components/dashboard/recent-activity',
  ],
  
  // Composants lourds (chargés à la demande)
  heavy: [
    'components/charts/ChartContainer',
    'components/editors/ImageEditor',
    'components/editors/CodeEditor',
    'components/viewers/3DViewer',
  ],
  
  // Composants de formulaire (chargés quand nécessaire)
  forms: [
    'components/forms/RichTextEditor',
    'components/forms/FileUpload',
    'components/forms/DatePicker',
    'components/forms/ColorPicker',
  ],
};

export default createLazyComponent;
