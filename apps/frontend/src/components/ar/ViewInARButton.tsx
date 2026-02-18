'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Smartphone, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';
import { getPlatformConfig } from '@/lib/ar/platforms/PlatformRouter';
import { launch as launchQuickLook } from '@/lib/ar/platforms/ARQuickLookProvider';
import { launch as launchSceneViewer } from '@/lib/ar/platforms/SceneViewerProvider';
import { QRCodeGenerator } from '@/components/ar/QRCodeGenerator';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export interface ViewInARButtonProps {
  /** GLB/GLTF model URL */
  glbModelUrl: string;
  /** USDZ URL for iOS (optional) */
  usdzModelUrl?: string;
  /** Product or model name (for analytics/labels) */
  productName?: string;
  /** Product ID (for analytics) */
  productId?: string;
  /** Poster image URL */
  posterUrl?: string;
  /** Click analytics callback */
  onTrackClick?: (platform: string, method: string) => void;
  className?: string;
  children?: React.ReactNode;
}

function ViewInARButtonContent({
  glbModelUrl,
  usdzModelUrl,
  productName = 'Product',
  productId,
  posterUrl,
  onTrackClick,
  className,
  children,
}: ViewInARButtonProps) {
  const [loading, setLoading] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const viewUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/ar/viewer?model=${encodeURIComponent(glbModelUrl)}`;
  }, [glbModelUrl]);

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      const config = await getPlatformConfig();
      onTrackClick?.(config.platform, config.method);

      if (config.platform === 'ios' && usdzModelUrl) {
        launchQuickLook(usdzModelUrl);
        return;
      }
      if (config.platform === 'android') {
        launchSceneViewer(glbModelUrl, { fallbackUrl: viewUrl });
        return;
      }
      if (config.platform === 'desktop') {
        setQrOpen(true);
        return;
      }
      if (config.method === 'webxr') {
        window.open(viewUrl, '_blank');
        return;
      }
      setQrOpen(true);
    } catch (error) {
      logger.error('ViewInARButton: launch failed', { error, productId });
      setQrOpen(true);
    } finally {
      setLoading(false);
    }
  }, [glbModelUrl, usdzModelUrl, viewUrl, productId, onTrackClick]);

  const label = useMemo(() => {
    if (typeof navigator === 'undefined') return 'View in AR';
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return 'View in Your Space';
    if (/Android/.test(ua)) return 'View in 3D';
    return 'View in AR';
  }, []);

  return (
    <>
      <Script
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
        type="module"
        strategy="lazyOnload"
      />
      <Button
        onClick={handleClick}
        disabled={loading}
        size="lg"
        className={className}
        aria-label={label}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 mr-2 animate-spin" aria-hidden />
        ) : (
          <Smartphone className="h-5 w-5 mr-2" aria-hidden />
        )}
        {children ?? label}
      </Button>
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan to view in AR</DialogTitle>
            <DialogDescription>
              Use your phone camera to scan this QR code and open the experience in AR.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <QRCodeGenerator url={viewUrl} size={220} showDownload showCopyLink onCopyLabel="Link copied" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ViewInARButton(props: ViewInARButtonProps) {
  return (
    <ErrorBoundary componentName="ViewInARButton">
      <ViewInARButtonContent {...props} />
    </ErrorBoundary>
  );
}
