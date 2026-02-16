'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { endpoints } from '@/lib/api/client';
import { DeviceCompatibility, CompatibilityReport } from '@/lib/virtual-tryon/DeviceCompatibility';
import type { QualityLevel } from '@/lib/virtual-tryon/FPSOptimizer';
import { analytics } from '@/lib/analytics';
import { logger } from '@/lib/logger';

interface PerformanceSample {
  fps: number;
  detectionLatencyMs: number;
  renderLatencyMs: number;
  gpuInfo?: string;
  deviceType: string;
  browserInfo?: string;
}

interface UseTryOnReturn {
  // Session management
  startSession: (configId: string, productId: string) => Promise<string | null>;
  endSession: (conversionAction?: string) => Promise<void>;

  // Screenshots
  captureScreenshot: (dataUrl: string, productId: string) => void;
  screenshots: Array<{ dataUrl: string; productId: string }>;
  removeScreenshot: (index: number) => void;

  // Product switching
  switchProduct: (productId: string) => void;
  currentProductId: string | null;

  // Device compatibility
  compatibility: CompatibilityReport | null;
  checkCompatibility: () => Promise<CompatibilityReport>;

  // Performance
  recordPerformanceMetric: (metric: PerformanceSample) => void;
  fps: number;
  quality: QualityLevel;
  setFps: (fps: number) => void;
  setQuality: (quality: QualityLevel) => void;

  // State
  isLoading: boolean;
  isTracking: boolean;
  setIsTracking: (tracking: boolean) => void;
  sessionId: string | null;
  error: Error | null;
}

/**
 * useTryOn - React hook encapsulating the full Virtual Try-On session lifecycle.
 *
 * Manages: session creation/end, screenshot batch upload, performance metrics,
 * device compatibility, and product switching.
 */
export function useTryOn(): UseTryOnReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<Array<{ dataUrl: string; productId: string }>>([]);
  const [compatibility, setCompatibility] = useState<CompatibilityReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [fps, setFps] = useState(0);
  const [quality, setQuality] = useState<QualityLevel>('high');
  const [error, setError] = useState<Error | null>(null);

  // Performance metrics buffer
  const perfMetricsRef = useRef<PerformanceSample[]>([]);

  // Refs for stable access in callbacks and cleanup
  const sessionIdRef = useRef(sessionId);
  const qualityRef = useRef(quality);

  /**
   * Start a new try-on session.
   */
  const startSession = useCallback(
    async (configId: string, productId: string): Promise<string | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Generate visitor ID
        const visitorId =
          localStorage.getItem('luneo_visitor_id') ||
          `v_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        localStorage.setItem('luneo_visitor_id', visitorId);

        const deviceInfo = {
          deviceType: DeviceCompatibility.getDeviceType(),
          gpuInfo: DeviceCompatibility.getGPUInfo(),
          browserInfo: DeviceCompatibility.getBrowserInfo(),
          screenSize: `${window.screen.width}x${window.screen.height}`,
        };

        const response = await endpoints.tryOn.createSession({
          configurationId: configId,
          visitorId,
          deviceInfo,
        });

        const res = response as { data?: { sessionId?: string; id?: string }; sessionId?: string; id?: string };
        const sid = res.data?.sessionId || res.data?.id || res.sessionId || res.id || null;
        setSessionId(sid);
        setCurrentProductId(productId);
        setScreenshots([]);
        perfMetricsRef.current = [];

        logger.info('Try-on session started', { sessionId: sid, configId });

        analytics.track('try_on', 'tryon_session_started', {
          label: configId,
          metadata: { sessionId: sid, productId, deviceType: deviceInfo.deviceType },
        });

        return sid;
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Failed to start session');
        setError(e);
        logger.error('Failed to start try-on session', { error: e.message });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * End the current session. Uploads batch screenshots and performance metrics.
   */
  const endSession = useCallback(
    async (conversionAction?: string) => {
      if (!sessionId) return;

      setIsLoading(true);

      try {
        // Batch upload screenshots
        if (screenshots.length > 0) {
          try {
            await endpoints.tryOn.batchUploadScreenshots(sessionId, {
              screenshots: screenshots.map((s) => ({
                imageBase64: s.dataUrl,
                productId: s.productId,
              })),
            });
          } catch (err) {
            logger.warn('Screenshot batch upload failed', { error: err });
          }
        }

        // Upload performance metrics
        if (perfMetricsRef.current.length > 0) {
          try {
            await endpoints.tryOn.submitPerformance(sessionId, {
              metrics: perfMetricsRef.current,
            });
          } catch (err) {
            logger.warn('Performance metrics upload failed', { error: err });
          }
        }

        // End session on backend
        await endpoints.tryOn.endSession(sessionId, {
          conversionAction,
          renderQuality: quality,
        });

        logger.info('Try-on session ended', {
          sessionId,
          screenshots: screenshots.length,
          perfSamples: perfMetricsRef.current.length,
        });

        analytics.track('try_on', 'tryon_session_ended', {
          label: sessionId || undefined,
          value: screenshots.length,
          metadata: {
            screenshotCount: screenshots.length,
            perfSamples: perfMetricsRef.current.length,
            quality,
            conversionAction,
          },
        });
      } catch (err) {
        logger.error('Failed to end try-on session', { error: err });
      } finally {
        setSessionId(null);
        setCurrentProductId(null);
        setScreenshots([]);
        perfMetricsRef.current = [];
        setIsLoading(false);
      }
    },
    [sessionId, screenshots, quality],
  );

  /**
   * Capture a screenshot and store locally.
   */
  const captureScreenshot = useCallback(
    (dataUrl: string, productId: string) => {
      setScreenshots((prev) => [...prev, { dataUrl, productId }]);
      analytics.track('try_on', 'tryon_screenshot_captured', {
        label: productId,
        metadata: { sessionId: sessionIdRef.current },
      });
    },
    [],
  );

  /**
   * Remove a screenshot by index.
   */
  const removeScreenshot = useCallback((index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Switch the displayed product and track it on the backend.
   */
  const switchProduct = useCallback((productId: string) => {
    setCurrentProductId(productId);

    // Track product tried on backend (fire-and-forget)
    const sid = sessionIdRef.current;
    if (sid) {
      endpoints.tryOn.trackProductTried(sid, productId).catch(() => {});
    }

    analytics.track('try_on', 'tryon_product_tried', {
      label: productId,
      metadata: { sessionId: sid },
    });
  }, []);

  /**
   * Check device compatibility.
   */
  const checkCompatibility = useCallback(async (): Promise<CompatibilityReport> => {
    const report = await DeviceCompatibility.check();
    setCompatibility(report);
    return report;
  }, []);

  /**
   * Record a performance metric sample (buffered, uploaded at session end).
   */
  const recordPerformanceMetric = useCallback((metric: PerformanceSample) => {
    // Keep max 100 samples (sampled)
    if (perfMetricsRef.current.length < 100) {
      perfMetricsRef.current.push(metric);
    } else {
      // Replace random sample for reservoir sampling
      const idx = Math.floor(Math.random() * perfMetricsRef.current.length);
      perfMetricsRef.current[idx] = metric;
    }
  }, []);

  // Keep refs in sync for cleanup
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { qualityRef.current = quality; }, [quality]);

  // Cleanup on unmount: try to end session gracefully
  useEffect(() => {
    return () => {
      if (sessionIdRef.current) {
        // Fire and forget using refs to avoid stale closure
        endpoints.tryOn
          .endSession(sessionIdRef.current, { renderQuality: qualityRef.current })
          .catch(() => {});
      }
    };
  }, []);

  return {
    startSession,
    endSession,
    captureScreenshot,
    screenshots,
    removeScreenshot,
    switchProduct,
    currentProductId,
    compatibility,
    checkCompatibility,
    recordPerformanceMetric,
    fps,
    quality,
    setFps,
    setQuality,
    isLoading,
    isTracking,
    setIsTracking,
    sessionId,
    error,
  };
}
