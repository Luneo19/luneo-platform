'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Fonction pour échapper HTML et prévenir XSS
const escapeHtml = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

interface ViewInARProps {
  productId: string;
  productName: string;
  glbModelUrl: string;
  usdzModelUrl?: string;
  posterUrl?: string;
}

function ViewInARContent({ 
  productId, 
  productName, 
  glbModelUrl, 
  usdzModelUrl,
  posterUrl 
}: ViewInARProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Detect device type
  const deviceInfo = useMemo(() => ({
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
    supportsWebXR: 'xr' in navigator,
  }), []);

  const handleViewInAR = useCallback(async () => {
    setIsLoading(true);

    try {
      if (deviceInfo.isIOS && usdzModelUrl) {
        // iOS AR Quick Look
        const anchor = document.createElement('a');
        anchor.rel = 'ar';
        anchor.href = usdzModelUrl;
        anchor.appendChild(document.createElement('img'));
        anchor.click();
      } else if (deviceInfo.isAndroid) {
        // Android Scene Viewer
        const intent = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(glbModelUrl)}&mode=ar_preferred#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(window.location.href)};end;`;
        window.location.href = intent;
      } else if (deviceInfo.supportsWebXR) {
        // WebXR for desktop browsers
        await activateWebXR();
      } else {
        // Fallback to 3D viewer
        window.open(`/3d-view/${productId}`, '_blank');
      }
    } catch (error) {
      logger.error('AR activation failed', {
        error,
        productId,
        productName,
        deviceInfo,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      alert('AR not supported on this device. Opening 3D viewer instead.');
      window.open(`/3d-view/${productId}`, '_blank');
    } finally {
      setIsLoading(false);
    }
  }, [deviceInfo, usdzModelUrl, glbModelUrl, productId, productName]);

  const activateWebXR = useCallback(async () => {
    // WebXR implementation will be handled by the 3D viewer page
    window.open(`/3d-view/${productId}?ar=true`, '_blank');
  }, [productId]);

  const escapedGlbUrl = useMemo(() => escapeHtml(glbModelUrl), [glbModelUrl]);
  const escapedProductName = useMemo(() => escapeHtml(productName), [productName]);
  const escapedPosterUrl = useMemo(() => escapeHtml(posterUrl || ''), [posterUrl]);

  return (
    <div className="space-y-4">
      {/* Load model-viewer script on-demand (only when AR component is rendered) */}
      <Script
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
        type="module"
        strategy="lazyOnload"
      />
      {/* model-viewer for WebXR */}
      {!deviceInfo.isIOS && !deviceInfo.isAndroid && (
        <div 
          dangerouslySetInnerHTML={{
            __html: `
              <model-viewer
                src="${escapedGlbUrl}"
                alt="${escapedProductName}"
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                auto-rotate
                shadow-intensity="1"
                poster="${escapedPosterUrl}"
                style="width: 100%; height: 400px; background: #f3f4f6; border-radius: 8px;"
              >
            `
          }}
        />
      )}

      {/* View in AR Button */}
      <Button
        onClick={handleViewInAR}
        disabled={isLoading}
        size="lg"
        className="w-full"
        variant="default"
      >
        <Smartphone className="mr-2 h-5 w-5" />
        {isLoading ? 'Loading AR...' : 'View in Your Space (AR)'}
      </Button>

      {/* Platform-specific hints */}
      <p className="text-xs text-muted-foreground text-center">
        {deviceInfo.isIOS && '📱 Point your camera at a flat surface'}
        {deviceInfo.isAndroid && '📱 Use AR to place this product in your space'}
        {!deviceInfo.isIOS && !deviceInfo.isAndroid && '💻 View in 3D on your screen'}
      </p>
    </div>
  );
}

const ViewInARContentMemo = memo(ViewInARContent);

export function ViewInAR(props: ViewInARProps) {
  return (
    <ErrorBoundary componentName="ViewInAR">
      <ViewInARContentMemo {...props} />
    </ErrorBoundary>
  );
}

