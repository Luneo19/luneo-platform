/**
 * Google Analytics 4 Integration
 * Inspired by Vercel Analytics and Stripe tracking
 */

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'set' | 'js',
      targetId: string | Date,
      config?: Record<string, unknown>,
    ) => void;
    dataLayer: Array<unknown>;
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

/**
 * Initialize Google Analytics
 */
export function initGoogleAnalytics(): void {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) {
    return;
  }

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
  });

  // Load GA script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
    page_title: title,
  });
}

/**
 * Track custom event
 */
export function trackEvent(
  eventName: string,
  parameters?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', eventName, {
    ...parameters,
    event_category: parameters?.category || 'general',
    event_label: parameters?.label,
    value: parameters?.value,
  });
}

/**
 * Track conversion
 */
export function trackConversion(
  conversionId: string,
  value?: number,
  currency: string = 'EUR',
): void {
  trackEvent('conversion', {
    send_to: conversionId,
    value,
    currency,
  });
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('set', 'user_properties', properties);
}

/**
 * Set user ID
 */
export function setUserId(userId: string): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('config', GA_MEASUREMENT_ID, { user_id: userId });
}
