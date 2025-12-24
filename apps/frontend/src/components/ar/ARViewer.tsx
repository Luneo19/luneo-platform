'use client';

import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Smartphone, Globe } from 'lucide-react';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface ARViewerProps {
  designId: string;
  designName?: string;
  className?: string;
}

interface ARResponse {
  usdzUrl: string;
  expiresAt: string;
  platform: 'ios' | 'android' | 'webxr';
  cacheKey?: string;
  optimized?: boolean;
}

function ARViewerContent({ designId, designName = 'Design', className }: ARViewerProps) {
  const [loading, setLoading] = useState(false);
  const [arData, setArData] = useState<ARResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'webxr' | null>(null);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const supportsWebXR = 'xr' in navigator;

    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else if (supportsWebXR) {
      setPlatform('webxr');
    } else {
      setPlatform('ios'); // Default to iOS for best compatibility
    }
  }, []);

  const fetchARUrl = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/designs/${designId}/ar`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load AR model');
      }

      const data: ARResponse = await response.json();
      setArData(data);
      openAR(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AR');
      logger.error('AR fetch error', {
        error: err,
        designId,
        platform,
      });
    } finally {
      setLoading(false);
    }
  }, [designId, platform]);

  const openAR = useCallback((data: ARResponse) => {
    if (!data.usdzUrl) {
      setError('No AR URL available');
      return;
    }

    switch (platform) {
      case 'ios':
        openIOSAR(data.usdzUrl);
        break;
      case 'android':
        openAndroidAR(data.usdzUrl);
        break;
      case 'webxr':
        openWebXR(data.usdzUrl);
        break;
      default:
        // Fallback: try iOS QuickLook
        openIOSAR(data.usdzUrl);
    }
  }, [platform, designName]);

  const openIOSAR = useCallback((usdzUrl: string) => {
    // Create anchor with rel="ar" for iOS Quick Look
    const link = document.createElement('a');
    link.href = usdzUrl;
    link.rel = 'ar';
    link.setAttribute('data-ar-title', designName);
    link.setAttribute('data-ar-calltoaction', 'View in your space');
    
    // Create preview image
    const img = document.createElement('img');
    img.src = '/ar-icon-ios.png';
    img.alt = `View ${designName} in AR`;
    img.style.width = '200px';
    img.style.height = '200px';
    
    link.appendChild(img);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  }, [designName]);

  const openAndroidAR = useCallback((glbUrl: string) => {
    // Android Scene Viewer intent
    const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(glbUrl)}&mode=ar_preferred&title=${encodeURIComponent(designName)}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(glbUrl)};end;`;
    
    // Try intent first
    window.location.href = intentUrl;
    
    // Fallback after delay
    setTimeout(() => {
      window.open(glbUrl, '_blank');
    }, 1000);
  }, [designName]);

  const openWebXR = useCallback(async (modelUrl: string) => {
    // WebXR viewer (simplified - would need full WebXR implementation)
    try {
      // Check if WebXR is supported
      if (!('xr' in navigator)) {
        throw new Error('WebXR not supported');
      }

      // For now, open in a new window with WebXR viewer
      // In production, you'd implement a full WebXR scene
      const viewerUrl = `/ar/viewer?model=${encodeURIComponent(modelUrl)}&title=${encodeURIComponent(designName)}`;
      window.open(viewerUrl, '_blank');
    } catch (err) {
      logger.error('WebXR error', {
        error: err,
        modelUrl,
        designName,
      });
      // Fallback to download
      window.open(modelUrl, '_blank');
    }
  }, [designName]);

  const platformIcon = useMemo(() => {
    if (platform === 'ios' || platform === 'android') return <Smartphone className="mr-2 h-4 w-4" />;
    if (platform === 'webxr') return <Globe className="mr-2 h-4 w-4" />;
    return <Smartphone className="mr-2 h-4 w-4" />;
  }, [platform]);

  const platformText = useMemo(() => {
    if (platform === 'ios') return 'Tap to open in AR Quick Look';
    if (platform === 'android') return 'Opening Scene Viewer...';
    if (platform === 'webxr') return 'Opening WebXR viewer...';
    return '';
  }, [platform]);

  return (
    <div className={className}>
      <Button
        onClick={fetchARUrl}
        disabled={loading}
        className="w-full"
        variant="outline"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading AR...
          </>
        ) : (
          <>
            {platformIcon}
            View in AR
          </>
        )}
      </Button>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      {arData && !error && (
        <p className="mt-2 text-xs text-muted-foreground">
          {platformText}
        </p>
      )}
    </div>
  );
}

const ARViewerContentMemo = memo(ARViewerContent);

export function ARViewer(props: ARViewerProps) {
  return (
    <ErrorBoundary componentName="ARViewer">
      <ARViewerContentMemo {...props} />
    </ErrorBoundary>
  );
}

export default ARViewer;
