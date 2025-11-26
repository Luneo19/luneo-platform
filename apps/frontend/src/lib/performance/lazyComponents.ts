import dynamic from 'next/dynamic';
import React from 'react';

// Lazy load heavy components for better performance

// Customizer components (export nommé)
export const ProductCustomizer = dynamic(
  () => import('@/components/Customizer/ProductCustomizer').then(mod => ({ default: mod.ProductCustomizer })),
  {
    loading: () => React.createElement('div', { className: "flex items-center justify-center h-screen" }, "Loading Customizer..."),
    ssr: false,
  }
);

// 3D Configurator components (export par défaut)
export const ProductConfigurator3D = dynamic(
  () => import('@/components/3d-configurator/ProductConfigurator3D'),
  {
    loading: () => React.createElement('div', { className: "flex items-center justify-center h-screen" }, "Loading 3D Configurator..."),
    ssr: false,
  }
);

// Virtual Try-On components (exports par défaut)
export const EyewearTryOn = dynamic(
  () => import('@/components/virtual-tryon/EyewearTryOn'),
  {
    loading: () => React.createElement('div', {}, "Loading Try-On..."),
    ssr: false,
  }
);

export const WatchTryOn = dynamic(
  () => import('@/components/virtual-tryon/WatchTryOn'),
  {
    loading: () => React.createElement('div', {}, "Loading Try-On..."),
    ssr: false,
  }
);

export const JewelryTryOn = dynamic(
  () => import('@/components/virtual-tryon/JewelryTryOn'),
  {
    loading: () => React.createElement('div', {}, "Loading Try-On..."),
    ssr: false,
  }
);

// Template & Clipart browsers (exports nommés)
export const TemplateGallery = dynamic(
  () => import('@/components/TemplateGallery').then((mod) => ({ default: mod.TemplateGallery })),
  {
    loading: () => React.createElement('div', {}, "Loading Templates..."),
    ssr: false,
  }
);

export const ClipartBrowser = dynamic(
  () => import('@/components/ClipartBrowser').then((mod) => ({ default: mod.ClipartBrowser })),
  {
    loading: () => React.createElement('div', {}, "Loading Cliparts..."),
    ssr: false,
  }
);

// AR components (exports nommés)
export const ViewInAR = dynamic(
  () => import('@/components/ar/ViewInAR').then((mod) => ({ default: mod.ViewInAR })),
  {
    loading: () => React.createElement('div', {}, "Loading AR Viewer..."),
    ssr: false,
  }
);

export const ARScreenshot = dynamic(
  () => import('@/components/ar/ARScreenshot').then((mod) => ({ default: mod.ARScreenshot })),
  {
    loading: () => React.createElement('div', {}, "Loading AR Screenshot..."),
    ssr: false,
  }
);
