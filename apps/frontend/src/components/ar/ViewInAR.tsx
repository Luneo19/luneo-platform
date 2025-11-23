'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';
import { logger } from '@/lib/logger';

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

export function ViewInAR({ 
  productId, 
  productName, 
  glbModelUrl, 
  usdzModelUrl,
  posterUrl 
}: ViewInARProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Detect device type
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const supportsWebXR = 'xr' in navigator;

  const handleViewInAR = async () => {
    setIsLoading(true);

    try {
      if (isIOS && usdzModelUrl) {
        // iOS AR Quick Look
        const anchor = document.createElement('a');
        anchor.rel = 'ar';
        anchor.href = usdzModelUrl;
        anchor.appendChild(document.createElement('img'));
        anchor.click();
      } else if (isAndroid) {
        // Android Scene Viewer
        const intent = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(glbModelUrl)}&mode=ar_preferred#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(window.location.href)};end;`;
        window.location.href = intent;
      } else if (supportsWebXR) {
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
        isIOS,
        isAndroid,
        supportsWebXR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      alert('AR not supported on this device. Opening 3D viewer instead.');
      window.open(`/3d-view/${productId}`, '_blank');
    } finally {
      setIsLoading(false);
    }
  };

  const activateWebXR = async () => {
    // WebXR implementation will be handled by the 3D viewer page
    window.open(`/3d-view/${productId}?ar=true`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* model-viewer for WebXR */}
      {!isIOS && !isAndroid && (
        <div 
          dangerouslySetInnerHTML={{
            __html: `
              <model-viewer
                src="${escapeHtml(glbModelUrl)}"
                alt="${escapeHtml(productName)}"
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                auto-rotate
                shadow-intensity="1"
                poster="${escapeHtml(posterUrl || '')}"
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
        {isIOS && '📱 Point your camera at a flat surface'}
        {isAndroid && '📱 Use AR to place this product in your space'}
        {!isIOS && !isAndroid && '💻 View in 3D on your screen'}
      </p>
    </div>
  );
}

