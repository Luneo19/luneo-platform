'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

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
    <Suspense fallback={<SceneLoader />}>
      <Scene />
    </Suspense>
  );
}
