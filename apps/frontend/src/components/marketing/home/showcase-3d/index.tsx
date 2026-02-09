'use client';

import React, { Component, Suspense, ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Error boundary for 3D scenes (WebGL failures, context lost, etc.)
class Scene3DErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <SceneFallback />;
    }
    return this.props.children;
  }
}

function SceneFallback() {
  return (
    <div className="w-full h-full min-h-[260px] sm:min-h-[350px] md:min-h-[400px] flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-purple-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
        </div>
        <p className="text-sm text-slate-400">Visualisation 3D</p>
      </div>
    </div>
  );
}

// Loading fallback for 3D scenes
function SceneLoader() {
  return (
    <div className="w-full h-full min-h-[260px] sm:min-h-[350px] md:min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
        <span className="text-xs text-slate-500">Chargement 3D...</span>
      </div>
    </div>
  );
}

// Dynamic imports with SSR disabled (Three.js requires browser APIs)
const DesignStudioScene = dynamic(
  () => import('./DesignStudioScene').then((mod) => ({ default: mod.DesignStudioScene })),
  { ssr: false, loading: SceneLoader }
);

const Configurator3DScene = dynamic(
  () => import('./Configurator3DScene').then((mod) => ({ default: mod.Configurator3DScene })),
  { ssr: false, loading: SceneLoader }
);

const VirtualTryOnScene = dynamic(
  () => import('./VirtualTryOnScene').then((mod) => ({ default: mod.VirtualTryOnScene })),
  { ssr: false, loading: SceneLoader }
);

const AnalyticsScene = dynamic(
  () => import('./AnalyticsScene').then((mod) => ({ default: mod.AnalyticsScene })),
  { ssr: false, loading: SceneLoader }
);

// =============================================================================
// SHOWCASE 3D - Tab content selector
// =============================================================================

const SCENES = [DesignStudioScene, Configurator3DScene, VirtualTryOnScene, AnalyticsScene];

export function Showcase3D({ activeTab }: { activeTab: number }) {
  const Scene = SCENES[activeTab] || SCENES[0];

  return (
    <Scene3DErrorBoundary>
      <Suspense fallback={<SceneLoader />}>
        <Scene />
      </Suspense>
    </Scene3DErrorBoundary>
  );
}
