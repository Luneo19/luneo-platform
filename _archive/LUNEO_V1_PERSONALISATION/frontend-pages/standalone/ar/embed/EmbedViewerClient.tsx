'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';
import { getPlatformConfig } from '@/lib/ar/platforms/PlatformRouter';
import { launch as launchQuickLook } from '@/lib/ar/platforms/ARQuickLookProvider';
import { launch as launchSceneViewer } from '@/lib/ar/platforms/SceneViewerProvider';
import { Button } from '@/components/ui/button';
import { Smartphone, Loader2 } from 'lucide-react';
import { ARPreview } from '@/components/ar/ARPreview';

export const EMBED_POST_MESSAGE_ORIGIN = '*';

export type EmbedMessageType =
  | 'embed_ready'
  | 'embed_loaded'
  | 'embed_error'
  | 'embed_ar_click'
  | 'embed_fullscreen_change';

export interface EmbedMessage {
  type: EmbedMessageType;
  payload?: Record<string, unknown>;
}

function useEmbedPostMessage() {
  const send = useCallback((msg: EmbedMessage) => {
    if (typeof window === 'undefined' || !window.parent) return;
    try {
      window.parent.postMessage(msg, EMBED_POST_MESSAGE_ORIGIN);
    } catch (e) {
      logger.warn('Embed postMessage failed', { error: e });
    }
  }, []);

  return { send };
}

export function EmbedViewerClient() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const modelId = searchParams.get('modelId');
  const [config, setConfig] = useState<{
    embedUrl: string;
    models: Array<{ id: string; name: string; viewerUrl: string }>;
  } | null>(null);
  const [selectedModelUrl, setSelectedModelUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { send: postMessage } = useEmbedPostMessage();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!projectId && !modelId) {
      setError('Missing projectId or modelId');
      setLoading(false);
      postMessage({ type: 'embed_error', payload: { message: 'Missing projectId or modelId' } });
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        if (modelId) {
          const viewerConfig = await endpoints.ar.viewerConfig(modelId);
          const modelUrl = (viewerConfig as { android?: { modelUrl: string }; web?: { modelViewer?: { src: string } } }).android?.modelUrl
            ?? (viewerConfig as { web?: { modelViewer?: { src: string } } }).web?.modelViewer?.src;
          if (!cancelled) {
            setSelectedModelUrl(modelUrl ?? null);
            setConfig({ embedUrl: '', models: [{ id: modelId, name: 'Model', viewerUrl: '' }] });
            postMessage({ type: 'embed_loaded', payload: { modelUrl: modelUrl ?? undefined } });
          }
        } else if (projectId) {
          const data = await endpoints.ar.embedConfig(projectId);
          if (cancelled) return;
          setConfig(data);
          const first = data.models[0];
          if (first?.viewerUrl) {
            const pathParts = first.viewerUrl.replace(/^https?:\/\/[^/]+/, '').split('/').filter(Boolean);
            const mid = pathParts[pathParts.length - 1];
            if (mid) {
              try {
                const vc = await endpoints.ar.viewerConfig(mid);
                const modelUrl = (vc as { android?: { modelUrl: string }; web?: { modelViewer?: { src: string } } }).android?.modelUrl
                  ?? (vc as { web?: { modelViewer?: { src: string } } }).web?.modelViewer?.src;
                if (!cancelled) {
                  setSelectedModelUrl(modelUrl ?? null);
                  postMessage({ type: 'embed_loaded', payload: { modelUrl: modelUrl ?? undefined } });
                }
              } catch (_) {
                if (!cancelled) setSelectedModelUrl(null);
              }
            }
          }
        }
        if (!cancelled) postMessage({ type: 'embed_ready' });
      } catch (e) {
        if (!cancelled) {
          logger.error('Embed load failed', { error: e, projectId, modelId });
          setError('Failed to load embed');
          postMessage({ type: 'embed_error', payload: { message: 'Failed to load' } });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [projectId, modelId, postMessage]);

  const handleViewInAR = useCallback(async () => {
    postMessage({ type: 'embed_ar_click' });
    if (!selectedModelUrl) return;

    const plat = await getPlatformConfig();
    if (plat.platform === 'ios') {
      const vc = modelId ? await endpoints.ar.viewerConfig(modelId) : null;
      const usdz = (vc as { ios?: { arQuickLookUrl: string } })?.ios?.arQuickLookUrl;
      if (usdz) {
        launchQuickLook(usdz);
        return;
      }
    }
    if (plat.platform === 'android') {
      launchSceneViewer(selectedModelUrl, { fallbackUrl: window.location.href });
      return;
    }
    window.open(`/ar/viewer?model=${encodeURIComponent(selectedModelUrl)}`, '_blank');
  }, [selectedModelUrl, modelId, postMessage]);

  const modelUrl = selectedModelUrl;

  if (loading) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center bg-gray-950" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-white" aria-hidden />
      </div>
    );
  }

  if (error || !modelUrl) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center bg-gray-950 p-4 text-center">
        <p className="text-gray-400">{error ?? 'No model available'}</p>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
        type="module"
        strategy="lazyOnload"
      />
      <div ref={containerRef} className="flex h-full w-full flex-col bg-gray-950 rounded-lg overflow-hidden" style={{ minHeight: '320px' }}>
        <div className="flex-1 relative min-h-[240px]">
          <ARPreview modelUrl={modelUrl} autoRotate onScreenshot={() => {}} />
        </div>
        <div className="shrink-0 p-3 border-t border-white/10 flex justify-center">
          <Button
            size="sm"
            onClick={handleViewInAR}
            className="gap-2"
            aria-label="View in AR"
          >
            <Smartphone className="h-4 w-4" />
            View in AR
          </Button>
        </div>
      </div>
    </>
  );
}
