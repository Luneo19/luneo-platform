/**
 * ★★★ ANALYTICS CONFIGURATION ★★★
 * Configuration analytics pour tracking utilisateur et événements
 */

import { logger } from '@/lib/logger';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  userId?: string;
  timestamp?: Date;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private events: AnalyticsEvent[] = [];

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Track un événement
   */
  track(event: AnalyticsEvent) {
    try {
      // Log event
      logger.info('Analytics event', {
        name: event.name,
        properties: event.properties,
        userId: event.userId,
      });

      // Store event (in production, send to analytics service)
      this.events.push({
        ...event,
        timestamp: event.timestamp || new Date(),
      });

      // In production, send to analytics service (e.g., PostHog, Mixpanel, etc.)
      if (typeof window !== 'undefined') {
        const win = window as Window & { analytics?: { track: (name: string, properties?: Record<string, unknown>) => void } };
        if (win.analytics) {
          win.analytics.track(event.name, event.properties);
        }
      }

      // Keep only last 100 events in memory
      if (this.events.length > 100) {
        this.events = this.events.slice(-100);
      }
    } catch (error) {
      logger.error('Error tracking analytics event', { error, event });
    }
  }

  /**
   * Track page view
   */
  trackPageView(path: string, properties?: Record<string, unknown>) {
    this.track({
      name: 'page_view',
      properties: {
        path,
        ...properties,
      },
    });
  }

  /**
   * Track custom event
   */
  trackEvent(name: string, properties?: Record<string, unknown>, userId?: string) {
    this.track({
      name,
      properties,
      userId,
    });
  }

  /**
   * Track conversion
   */
  trackConversion(eventName: string, value?: number, properties?: Record<string, unknown>) {
    this.track({
      name: eventName,
      properties: {
        ...properties,
        value,
        conversion: true,
      },
    });
  }

  /**
   * Get events (for debugging)
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Clear events
   */
  clearEvents() {
    this.events = [];
  }
}

export const analyticsService = AnalyticsService.getInstance();

