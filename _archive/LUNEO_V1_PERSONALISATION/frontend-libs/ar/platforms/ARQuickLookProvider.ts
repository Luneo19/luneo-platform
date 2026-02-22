/**
 * iOS AR Quick Look provider.
 * Launches USDZ via <a rel="ar"> for native AR on iPhone/iPad.
 * @module ar/platforms/ARQuickLookProvider
 */

import { logger } from '@/lib/logger';

export interface ARQuickLookOptions {
  /** Allow scaling the model */
  allowScaling?: boolean;
  /** Canonical URL for the model (optional) */
  canonicalUrl?: string;
  /** Callback when Quick Look is dismissed (via hash or page focus) */
  onDismiss?: () => void;
}

/**
 * Check if AR Quick Look is supported (iOS Safari with USDZ).
 */
export function isSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  return isIOS;
}

/**
 * Launch AR Quick Look with a USDZ URL.
 * Creates a temporary <a rel="ar"> and triggers click.
 */
export function launch(usdzUrl: string, options: ARQuickLookOptions = {}): boolean {
  if (!usdzUrl || !usdzUrl.startsWith('http')) {
    logger.error('ARQuickLookProvider: invalid usdzUrl', { usdzUrl });
    return false;
  }

  const a = document.createElement('a');
  a.href = usdzUrl;
  a.rel = 'ar';

  if (options.allowScaling === false) {
    a.setAttribute('data-scale', 'fixed');
  }
  if (options.canonicalUrl) {
    a.setAttribute('data-canonical-url', options.canonicalUrl);
  }

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (options.onDismiss) {
    const handleVisibility = (): void => {
      if (document.visibilityState === 'visible') {
        document.removeEventListener('visibilitychange', handleVisibility);
        options.onDismiss?.();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
  }

  logger.info('ARQuickLookProvider: launched', { usdzUrl: usdzUrl.slice(0, 80) });
  return true;
}

/**
 * Check if current URL hash indicates Quick Look callback (e.g. ?ar=true).
 * Can be used to detect return from Quick Look if you set a deep link.
 */
export function parseCallbackFromHash(): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash?.slice(1);
  if (!hash) return null;
  const params: Record<string, string> = {};
  hash.split('&').forEach((pair) => {
    const [k, v] = pair.split('=');
    if (k && v) params[decodeURIComponent(k)] = decodeURIComponent(v);
  });
  return Object.keys(params).length ? params : null;
}
