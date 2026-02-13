/**
 * useAnalytics Hook
 * A-006/A-007: Hook React pour tracking d'événements
 * 
 * Usage:
 * const { track, trackClick, trackPageView, trackCommerce } = useAnalytics();
 * 
 * track('user_action', 'click', { label: 'signup_button' });
 * trackClick('hero_cta');
 * trackCommerce('add_to_cart', { productId: '123', price: 29.99 });
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics } from './AnalyticsService';
import type { EventCategory, EventAction, UserProperties } from './types';

interface UseAnalyticsOptions {
  autoTrackPageViews?: boolean;
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const { autoTrackPageViews = true } = options;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialized = useRef(false);

  // Initialize analytics
  useEffect(() => {
    if (!isInitialized.current) {
      analytics.init();
      isInitialized.current = true;
    }
  }, []);

  // Auto-track page views
  useEffect(() => {
    if (autoTrackPageViews && pathname) {
      analytics.trackPageView(pathname);
    }
  }, [pathname, searchParams, autoTrackPageViews]);

  // Generic track function
  const track = useCallback((
    category: EventCategory,
    action: EventAction,
    options: {
      label?: string;
      value?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ) => {
    analytics.track(category, action, options);
  }, []);

  // Track click
  const trackClick = useCallback((
    element: string,
    metadata?: Record<string, unknown>
  ) => {
    analytics.trackClick(element, metadata);
  }, []);

  // Track page view
  const trackPageView = useCallback((path?: string) => {
    analytics.trackPageView(path);
  }, []);

  // Track form submit
  const trackFormSubmit = useCallback((
    formName: string,
    success: boolean,
    metadata?: Record<string, unknown>
  ) => {
    analytics.trackFormSubmit(formName, success, metadata);
  }, []);

  // Track error
  const trackError = useCallback((
    error: Error | string,
    metadata?: Record<string, unknown>
  ) => {
    analytics.trackError(error, metadata);
  }, []);

  // Track customization
  const trackCustomization = useCallback((
    action: 'customizer_open' | 'customizer_close' | 'element_add' | 'element_modify' | 'element_delete' | 'color_change' | 'text_add' | 'image_upload' | 'template_select',
    metadata?: Record<string, unknown>
  ) => {
    analytics.trackCustomization(action, metadata);
  }, []);

  // Track commerce
  const trackCommerce = useCallback((
    action: 'product_view' | 'add_to_cart' | 'remove_from_cart' | 'checkout_start' | 'checkout_complete' | 'purchase' | 'refund',
    options: {
      productId?: string;
      productName?: string;
      price?: number;
      quantity?: number;
      currency?: string;
      orderId?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ) => {
    analytics.trackCommerce(action, options);
  }, []);

  // Track design action
  const trackDesign = useCallback((
    action: 'design_create' | 'design_edit' | 'design_save' | 'design_delete' | 'design_export' | 'design_duplicate',
    metadata?: Record<string, unknown>
  ) => {
    analytics.track('design', action, { metadata });
  }, []);

  // Track engagement
  const trackEngagement = useCallback((
    action: 'video_play' | 'video_pause' | 'video_complete' | 'tutorial_start' | 'tutorial_complete' | 'feature_discover',
    metadata?: Record<string, unknown>
  ) => {
    analytics.track('engagement', action, { metadata });
  }, []);

  // Identify user
  const identify = useCallback((user: UserProperties) => {
    analytics.identify(user);
  }, []);

  // Reset (logout)
  const reset = useCallback(() => {
    analytics.reset();
  }, []);

  // Flush events
  const flush = useCallback(() => {
    analytics.flush();
  }, []);

  return {
    // Core tracking
    track,
    trackClick,
    trackPageView,
    trackFormSubmit,
    trackError,
    
    // Domain-specific tracking
    trackCustomization,
    trackCommerce,
    trackDesign,
    trackEngagement,
    
    // User management
    identify,
    reset,
    
    // Utils
    flush,
    
    // Session info
    getSession: analytics.getSession.bind(analytics),
    getUser: analytics.getUser.bind(analytics),
  };
}

/**
 * useTrackClick Hook
 * Simplified hook for click tracking with automatic cleanup
 */
export function useTrackClick(elementName: string, metadata?: Record<string, unknown>) {
  const { trackClick } = useAnalytics({ autoTrackPageViews: false });

  return useCallback(() => {
    trackClick(elementName, metadata);
  }, [trackClick, elementName, metadata]);
}

/**
 * useTrackVisibility Hook
 * Track when element becomes visible using IntersectionObserver
 */
export function useTrackVisibility(
  elementName: string,
  options: { threshold?: number; trackOnce?: boolean } = {}
) {
  const { threshold = 0.5, trackOnce = true } = options;
  const { track } = useAnalytics({ autoTrackPageViews: false });
  const hasTracked = useRef(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!trackOnce || !hasTracked.current)) {
            track('engagement', 'feature_discover', {
              label: elementName,
              value: Math.round(entry.intersectionRatio * 100),
            });
            hasTracked.current = true;
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementName, threshold, trackOnce, track]);

  return ref;
}

/**
 * useTrackTime Hook
 * Track time spent on a component/page
 */
export function useTrackTime(componentName: string) {
  const { track } = useAnalytics({ autoTrackPageViews: false });
  const startTime = useRef(Date.now());

  useEffect(() => {
    startTime.current = Date.now();

    return () => {
      const timeSpent = Date.now() - startTime.current;
      track('engagement', 'feature_discover', {
        label: `time_on_${componentName}`,
        value: Math.round(timeSpent / 1000), // seconds
        metadata: { duration_ms: timeSpent },
      });
    };
  }, [componentName, track]);
}

export default useAnalytics;


