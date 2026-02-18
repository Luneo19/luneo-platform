/**
 * Track AR conversions: add to cart, purchase; get attribution.
 * @module ar/analytics/ARConversionTracker
 */

import { logger } from '@/lib/logger';

const DEFAULT_BASE = '';

/**
 * Tracks AR-driven conversions and attribution.
 */
export class ARConversionTracker {
  private baseUrl: string = DEFAULT_BASE;
  private sessionId: string | null = null;

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  setSessionId(id: string | null): void {
    this.sessionId = id;
  }

  /**
   * Track add to cart from AR.
   */
  async trackAddToCart(productId: string, value?: number): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/v1/ar/session/conversion`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          action: 'add_to_cart',
          productId,
          value,
        }),
      });
    } catch (err) {
      logger.warn('ARConversionTracker: trackAddToCart failed', { error: String(err) });
    }
  }

  /**
   * Track purchase (order) from AR.
   */
  async trackPurchase(orderId: string, value?: number): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/v1/ar/session/conversion`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          action: 'purchase',
          orderId,
          value,
        }),
      });
    } catch (err) {
      logger.warn('ARConversionTracker: trackPurchase failed', { error: String(err) });
    }
  }

  /**
   * Get attribution for session (e.g. which campaign/session led to conversion).
   */
  async getAttribution(sessionId: string): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/ar/session/attribution?sessionId=${encodeURIComponent(sessionId)}`, {
        credentials: 'include',
      });
      if (!res.ok) return null;
      return (await res.json()) as Record<string, unknown>;
    } catch (err) {
      logger.warn('ARConversionTracker: getAttribution failed', { error: String(err) });
      return null;
    }
  }
}
