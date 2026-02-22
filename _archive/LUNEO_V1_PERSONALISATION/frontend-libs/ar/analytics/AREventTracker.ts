/**
 * Track AR events client-side; send to backend /ar/session/*.
 * @module ar/analytics/AREventTracker
 */

import { logger } from '@/lib/logger';

const DEFAULT_BASE = '';

/**
 * Tracks AR session and interaction events; sends to backend API.
 */
export class AREventTracker {
  private baseUrl: string = DEFAULT_BASE;
  private sessionId: string | null = null;

  /**
   * Set API base URL (e.g. from window.location.origin or env).
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  /**
   * Track session start; returns session id for later events.
   */
  async trackSessionStart(data?: Record<string, unknown>): Promise<string | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/ar/session/start`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data ?? {}),
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { sessionId?: string };
      this.sessionId = json.sessionId ?? null;
      return this.sessionId;
    } catch (err) {
      logger.warn('AREventTracker: trackSessionStart failed', { error: String(err) });
      return null;
    }
  }

  /**
   * Track session end.
   */
  async trackSessionEnd(data?: Record<string, unknown>): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/v1/ar/session/end`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: this.sessionId, ...data }),
      });
    } catch (err) {
      logger.warn('AREventTracker: trackSessionEnd failed', { error: String(err) });
    }
  }

  /**
   * Track interaction (e.g. place, tap, swipe).
   */
  async trackInteraction(type: string, data?: Record<string, unknown>): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/v1/ar/session/interaction`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: this.sessionId, type, ...data }),
      });
    } catch (err) {
      logger.warn('AREventTracker: trackInteraction failed', { error: String(err) });
    }
  }

  /**
   * Track conversion (e.g. add to cart, purchase).
   */
  async trackConversion(action: string, value?: number): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/v1/ar/session/conversion`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: this.sessionId, action, value }),
      });
    } catch (err) {
      logger.warn('AREventTracker: trackConversion failed', { error: String(err) });
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}
