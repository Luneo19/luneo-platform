'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import TryOnView from '@/components/virtual-tryon/TryOnView';
import TryOnScreenshotGallery from '@/components/virtual-tryon/TryOnScreenshotGallery';
import RecommendationPanel from '@/components/virtual-tryon/RecommendationPanel';
import type { TryOnCategory } from '@/lib/virtual-tryon/TryOnEngine';
import type { QualityLevel } from '@/lib/virtual-tryon/FPSOptimizer';
import { logger } from '@/lib/logger';

interface WidgetConfig {
  product: {
    id: string;
    name: string;
    fallbackImage?: string | null;
  };
  brand: {
    name: string;
    slug: string;
  };
  mapping: {
    id: string;
    model3dUrl?: string | null;
    modelUSDZUrl?: string | null;
    thumbnailUrl?: string | null;
    scaleFactor: number;
    enableOcclusion: boolean;
    enableShadows: boolean;
    defaultPosition?: { x: number; y: number; z: number } | null;
    defaultRotation?: { x: number; y: number; z: number } | null;
    lodLevels?: { high?: string; medium?: string; low?: string } | null;
  };
  configuration: {
    id: string;
    name: string;
    productType: string;
    targetZone?: string | null;
    renderSettings?: Record<string, unknown> | null;
    settings: Record<string, unknown>;
    uiConfig?: Record<string, unknown> | null;
  };
  modelSource: string;
}

interface TryOnWidgetProps {
  brandSlug: string;
  productId: string;
  config?: WidgetConfig;
  compact?: boolean;
  className?: string;
}

const PRODUCT_TYPE_TO_CATEGORY: Record<string, TryOnCategory> = {
  GLASSES: 'eyewear',
  WATCH: 'watch',
  JEWELRY: 'ring', // Default, refined by targetZone
  HAT: 'eyewear',
  MAKEUP: 'eyewear',
  CLOTHING: 'eyewear',
  ACCESSORY: 'watch',
};

const TARGET_ZONE_TO_CATEGORY: Record<string, TryOnCategory> = {
  WRIST: 'watch',
  FINGER: 'ring',
  EAR: 'earring',
  FACE: 'eyewear',
  NOSE: 'eyewear',
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * TryOnWidget - Embeddable Virtual Try-On component for brand storefronts.
 *
 * Loads configuration from the public API (no JWT needed).
 * Can be used standalone or embedded via iframe.
 */
export default function TryOnWidget({
  brandSlug,
  productId,
  config: externalConfig,
  compact = false,
  className,
}: TryOnWidgetProps) {
  const [config, setConfig] = useState<WidgetConfig | null>(externalConfig || null);
  const [loading, setLoading] = useState(!externalConfig);
  const [error, setError] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Keep ref in sync for cleanup
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  // End session on unmount or page unload
  useEffect(() => {
    const endSessionOnUnload = () => {
      const sid = sessionIdRef.current;
      if (!sid) return;
      // Use sendBeacon for reliable delivery during page unload
      const url = `${API_BASE}/api/v1/public/try-on/sessions/${encodeURIComponent(sid)}/end`;
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, JSON.stringify({}));
      } else {
        fetch(url, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', endSessionOnUnload);
    return () => {
      window.removeEventListener('beforeunload', endSessionOnUnload);
      endSessionOnUnload(); // Also end on component unmount
    };
  }, []);

  // Load configuration from public API
  useEffect(() => {
    if (externalConfig) return;

    let mounted = true;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/public/try-on/${encodeURIComponent(brandSlug)}/config/${encodeURIComponent(productId)}`,
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        if (mounted) {
          setConfig(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load configuration');
          logger.error('Widget config load failed', { brandSlug, productId, error: err });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [brandSlug, productId, externalConfig]);

  // Start a public session (ends any previous session first to avoid orphans)
  useEffect(() => {
    if (!config) return;

    let mounted = true;
    (async () => {
      try {
        // End any previous session to prevent orphaned sessions
        const prevSid = sessionIdRef.current;
        if (prevSid) {
          const endUrl = `${API_BASE}/api/v1/public/try-on/sessions/${encodeURIComponent(prevSid)}/end`;
          await fetch(endUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
          }).catch(() => {});
        }

        const visitorId = localStorage.getItem('luneo_visitor_id') ||
          `v_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        localStorage.setItem('luneo_visitor_id', visitorId);

        const res = await fetch(`${API_BASE}/api/v1/public/try-on/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            configurationId: config.configuration.id,
            visitorId,
            deviceInfo: {
              screenSize: `${window.screen.width}x${window.screen.height}`,
              userAgent: navigator.userAgent,
            },
          }),
        });

        if (res.ok && mounted) {
          const data = await res.json();
          setSessionId(data.sessionId || data.id);
        }
      } catch (err) {
        logger.warn('Failed to start widget session', { error: err });
      }
    })();

    return () => { mounted = false; };
  }, [config]);

  // Determine category from config
  const category: TryOnCategory = config
    ? (config.configuration.targetZone
        ? TARGET_ZONE_TO_CATEGORY[config.configuration.targetZone] || 'eyewear'
        : PRODUCT_TYPE_TO_CATEGORY[config.configuration.productType] || 'eyewear')
    : 'eyewear';

  const handleScreenshot = useCallback((dataUrl: string) => {
    setScreenshots((prev) => [...prev, dataUrl]);
  }, []);

  const trackConversion = useCallback(
    async (action: string) => {
      if (!sessionId) return;
      try {
        await fetch(`${API_BASE}/api/v1/public/try-on/conversions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            productId,
            action,
            source: 'widget',
            attributionData: {
              referrer: typeof document !== 'undefined' ? document.referrer : '',
              url: typeof window !== 'undefined' ? window.location.href : '',
            },
          }),
        });
      } catch (err) {
        logger.warn('Widget conversion tracking failed', { error: err });
      }
    },
    [sessionId, productId],
  );

  const handleAddToCart = useCallback(() => {
    trackConversion('ADD_TO_CART');
    // Notify parent window (for iframe integration)
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'luneo:add-to-cart',
          productId,
          brandSlug,
        },
        '*',
      );
    }
  }, [trackConversion, productId, brandSlug]);

  const handleWishlist = useCallback(() => {
    trackConversion('WISHLIST');
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'luneo:wishlist',
          productId,
          brandSlug,
        },
        '*',
      );
    }
  }, [trackConversion, productId, brandSlug]);

  const handleBatchUpload = useCallback(async (screenshotList: string[]) => {
    if (!sessionId || screenshotList.length === 0) return;

    try {
      await fetch(
        `${API_BASE}/api/v1/public/try-on/sessions/${encodeURIComponent(sessionId)}/screenshots/batch`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            screenshots: screenshotList.map((s) => ({
              imageBase64: s,
              productId,
            })),
          }),
        },
      );
    } catch (err) {
      logger.warn('Widget batch upload failed', { error: err });
    }
  }, [sessionId, productId]);

  // ========================================
  // Render states
  // ========================================

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-white min-h-[400px] ${className || ''}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm opacity-80">Chargement de l&apos;experience Try-On...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-white min-h-[300px] ${className || ''}`}>
        <div className="text-center p-6">
          <div className="text-4xl mb-3">&#x26A0;</div>
          <p className="text-sm opacity-80">
            {error || 'Configuration Try-On non disponible'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 ${className || ''}`}>
      {/* Brand header */}
      {!compact && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-sm">
                Essayez {config.product.name}
              </h3>
              <p className="text-gray-400 text-xs">
                par {config.brand.name}
              </p>
            </div>
            <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
              Try-On 3D
            </span>
          </div>
        </div>
      )}

      {/* Try-On view */}
      <TryOnView
        category={category}
        modelUrl={config.mapping.model3dUrl || undefined}
        modelUSDZUrl={config.mapping.modelUSDZUrl || undefined}
        lodLevels={config.mapping.lodLevels || undefined}
        scaleFactor={config.mapping.scaleFactor}
        defaultPosition={config.mapping.defaultPosition || undefined}
        defaultRotation={config.mapping.defaultRotation || undefined}
        enableOcclusion={config.mapping.enableOcclusion}
        enableShadows={config.mapping.enableShadows}
        productName={config.product.name}
        fallbackImage={config.product.fallbackImage || undefined}
        onScreenshot={handleScreenshot}
        className={compact ? 'aspect-square' : 'aspect-video'}
      />

      {/* Screenshots gallery (if any) */}
      {screenshots.length > 0 && (
        <div className="p-3 border-t border-gray-800">
          <TryOnScreenshotGallery
            screenshots={screenshots}
            onRemove={(idx) => setScreenshots((prev) => prev.filter((_, i) => i !== idx))}
            onBatchUpload={handleBatchUpload}
          />
        </div>
      )}

      {/* AI Recommendations */}
      {sessionId && (
        <div className="px-3 py-2 border-t border-gray-800">
          <RecommendationPanel
            sessionId={sessionId}
            currentProductId={productId}
            onSelectProduct={(pid) => {
              // Notify parent to switch product
              if (typeof window !== 'undefined' && window.parent !== window) {
                window.parent.postMessage(
                  { type: 'luneo:switch-product', productId: pid, brandSlug },
                  '*',
                );
              }
            }}
          />
        </div>
      )}

      {/* Conversion CTA */}
      <div className="px-4 py-3 border-t border-gray-800 flex gap-2">
        <button
          onClick={handleAddToCart}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          Ajouter au panier
        </button>
        <button
          onClick={handleWishlist}
          className="bg-gray-700 hover:bg-gray-600 text-white text-sm py-2.5 px-3 rounded-lg transition-colors"
          title="Ajouter aux favoris"
        >
          &#9825;
        </button>
      </div>

      {/* Powered by */}
      {!compact && (
        <div className="px-4 py-2 border-t border-gray-800 text-center">
          <span className="text-xs text-gray-500">
            Powered by Luneo
          </span>
        </div>
      )}
    </div>
  );
}
