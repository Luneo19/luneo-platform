'use client';

import Script from 'next/script';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';
import { getPlatformConfig, type ARLaunchMethod, type ARPlatform } from '@/lib/ar/platforms/PlatformRouter';
import { launch as launchQuickLook } from '@/lib/ar/platforms/ARQuickLookProvider';
import { launch as launchSceneViewer } from '@/lib/ar/platforms/SceneViewerProvider';
import { AlertCircle, Loader2, Smartphone, X } from 'lucide-react';
import { ARPreview } from '@/components/ar/ARPreview';
import { QRCodeGenerator } from '@/components/ar/QRCodeGenerator';

export interface ResolvedView {
  redirectUrl: string;
  modelId?: string;
  platform?: string;
  method?: string;
}

export interface ViewerConfig {
  platform: string;
  method: string;
  format: string;
  ios: { arQuickLookUrl: string; ready: boolean };
  android: { intentUrl: string; modelUrl: string; webxrFallback: boolean };
  web: { modelViewer?: { src: string; poster?: string }; webxr?: unknown };
  desktop: { qrTargetUrl: string; landingPageUrl: string };
}

interface ShortCodeViewerClientProps {
  shortCode: string;
  resolved: ResolvedView | null;
  error: string | null;
}

const BRAND_LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" fill="none"><circle cx="20" cy="20" r="16" stroke="currentColor" stroke-width="2"/><path d="M50 12v16l10-8-10-8z" fill="currentColor"/><text x="72" y="26" font-family="system-ui" font-size="14" font-weight="600" fill="currentColor">LUNEO</text></svg>';

export function ShortCodeViewerClient({ shortCode, resolved, error: initialError }: ShortCodeViewerClientProps) {
  const router = useRouter();
  const [viewerConfig, setViewerConfig] = useState<ViewerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(initialError);
  const [platformConfig, setPlatformConfig] = useState<{ platform: ARPlatform; method: ARLaunchMethod } | null>(null);

  const viewUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin;
    return `${base}/ar/${shortCode}`;
  }, [shortCode]);

  useEffect(() => {
    if (initialError) {
      setLoading(false);
      setError(initialError);
      return;
    }
    if (!resolved?.modelId) {
      setLoading(false);
      if (resolved?.redirectUrl) {
        window.location.href = resolved.redirectUrl;
        return;
      }
      setError('Invalid or expired link');
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        const config = await endpoints.ar.viewerConfig(resolved!.modelId!);
        if (cancelled) return;
        setViewerConfig(config as ViewerConfig);
        const plat = await getPlatformConfig();
        if (cancelled) return;
        setPlatformConfig({ platform: plat.platform, method: plat.method });
      } catch (e) {
        if (cancelled) return;
        logger.error('ShortCodeViewer: load config failed', { error: e, shortCode });
        setError('This link is invalid or has expired.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [resolved, initialError, shortCode]);

  const launchAR = useCallback(() => {
    if (!viewerConfig) return;

    if (platformConfig?.platform === 'ios' && viewerConfig.ios?.arQuickLookUrl) {
      launchQuickLook(viewerConfig.ios.arQuickLookUrl);
      return;
    }
    if (platformConfig?.platform === 'android' && viewerConfig.android?.modelUrl) {
      launchSceneViewer(viewerConfig.android.modelUrl, {
        title: 'View in AR',
        fallbackUrl: viewUrl,
      });
      return;
    }
    if (platformConfig?.method === 'webxr' && viewerConfig.web) {
      const modelUrl = (viewerConfig.web as { modelViewer?: { src: string } }).modelViewer?.src;
      if (modelUrl) {
        router.push(`/ar/viewer?model=${encodeURIComponent(modelUrl)}`);
        return;
      }
    }
    router.push(viewUrl);
  }, [viewerConfig, platformConfig, viewUrl, router]);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 p-4">
        <div className="flex max-w-md flex-col items-center text-center">
          <AlertCircle className="h-14 w-14 text-red-500 mb-4" aria-hidden />
          <h1 className="text-xl font-semibold text-white mb-2">Link expired or invalid</h1>
          <p className="text-gray-400 mb-6">This AR link is no longer available.</p>
          <Button onClick={() => router.back()} variant="outline" className="border-white/20 text-white">
            Go back
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !viewerConfig) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950" aria-busy="true" aria-live="polite">
        <div
          className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 [&>svg]:h-10 [&>svg]:w-10"
          dangerouslySetInnerHTML={{ __html: BRAND_LOGO_SVG }}
        />
        <Loader2 className="h-10 w-10 animate-spin text-white mb-4" aria-hidden />
        <p className="text-white font-medium">Loading experience…</p>
        <p className="text-gray-400 text-sm mt-1">Preparing your AR view</p>
      </div>
    );
  }

  const isDesktop = platformConfig?.platform === 'desktop';
  const modelUrl = (viewerConfig.web as { modelViewer?: { src: string } })?.modelViewer?.src ?? viewerConfig.android?.modelUrl ?? '';

  if (isDesktop) {
    return (
      <>
        <Script
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
          type="module"
          strategy="lazyOnload"
        />
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
          <header className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-white gap-2" aria-label="Go back">
              <X className="h-4 w-4" />
              Back
            </Button>
            <span className="text-sm text-gray-400">Scan with your phone for AR</span>
          </header>
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 min-h-0">
            <div className="relative rounded-xl overflow-hidden bg-black/40 flex items-center justify-center min-h-[280px]">
              {modelUrl ? (
                <ARPreview modelUrl={modelUrl} autoRotate onScreenshot={() => {}} />
              ) : (
                <p className="text-gray-500">No 3D preview available</p>
              )}
            </div>
            <div className="flex flex-col items-center justify-center p-6 border border-white/10 rounded-xl bg-black/20">
              <h2 className="text-lg font-semibold text-white mb-2">View in AR on your phone</h2>
              <p className="text-sm text-gray-400 mb-4">Scan the QR code with your device camera</p>
              <QRCodeGenerator
                url={viewUrl}
                size={220}
                showDownload={false}
                showCopyLink
                onCopyLabel="Short link copied"
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Script
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
        type="module"
        strategy="lazyOnload"
      />
      <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
        <div className="flex-1 flex flex-col min-h-0">
          {modelUrl ? (
            <>
              <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-white/90 gap-2" aria-label="Go back">
                  <X className="h-4 w-4" />
                  Back
                </Button>
              </div>
              {/* @ts-ignore model-viewer is a web component */}
              <model-viewer
                src={modelUrl}
                alt="AR model"
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                auto-rotate
                shadow-intensity="1"
                style={{ width: '100%', height: '100%', minHeight: '100vh', display: 'block' }}
              >
                <Button
                  slot="ar-button"
                  onClick={launchAR}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-xl px-6 py-3 font-semibold gap-2"
                  aria-label="View in your space"
                >
                  <Smartphone className="h-5 w-5" />
                  View in your space
                </Button>
              </model-viewer>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No 3D model URL available for this link.</AlertDescription>
              </Alert>
              <Button onClick={() => router.back()} variant="outline" className="mt-4">
                Go back
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
