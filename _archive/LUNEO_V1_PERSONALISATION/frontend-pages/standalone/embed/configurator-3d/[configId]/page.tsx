'use client';

import React, { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { EmbeddedConfigurator } from '@/components/configurator-3d/embed';
import { Loader2 } from 'lucide-react';

/**
 * Embed page - public route, no auth required.
 * Full-screen configurator in iframe-ready format.
 * URL params: configId (from path), theme (light/dark), layout (sidebar/bottom), customCss
 */
function EmbedConfiguratorContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const configId = params?.configId as string;

  const theme = (searchParams.get('theme') as 'light' | 'dark' | 'system') ?? 'light';
  const layout = (searchParams.get('layout') as 'sidebar' | 'bottom') ?? 'sidebar';
  const customCss = searchParams.get('customCss') ?? undefined;

  if (!configId) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Configuration ID is required</p>
      </div>
    );
  }

  const layoutMode = layout === 'bottom' ? 'minimal' : 'full';

  return (
    <div className="fixed inset-0 flex h-screen w-screen flex-col overflow-hidden">
      {customCss && (
        <style dangerouslySetInnerHTML={{ __html: decodeURIComponent(customCss) }} />
      )}
      <EmbeddedConfigurator
        configurationId={configId}
        theme={theme}
        layout={layoutMode}
        className="h-full w-full"
      />
    </div>
  );
}

function EmbedLoadingFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/30">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function EmbedConfiguratorPage() {
  return (
    <Suspense fallback={<EmbedLoadingFallback />}>
      <EmbedConfiguratorContent />
    </Suspense>
  );
}
