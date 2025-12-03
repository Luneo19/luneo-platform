/**
 * Analytics Service
 * A-006: Service centralisé de tracking d'événements
 * 
 * Features:
 * - Event batching pour optimisation réseau
 * - Persistence locale avec IndexedDB/localStorage
 * - Session tracking automatique
 * - Device fingerprinting léger
 * - Support offline avec sync
 * - Integration Vercel Analytics, Google Analytics, Mixpanel
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import type {
  AnalyticsEvent,
  TrackedEvent,
  DeviceInfo,
  PageInfo,
  UTMParams,
  UserProperties,
  SessionData,
  AnalyticsConfig,
  EventCategory,
  EventAction,
} from './types';

// Default configuration
const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  debug: process.env.NODE_ENV === 'development',
  trackPageViews: true,
  trackClicks: true,
  trackScrollDepth: true,
  trackFormSubmissions: true,
  trackErrors: true,
  trackPerformance: true,
  batchSize: 10,
  batchInterval: 5000, // 5 seconds
  storageKey: 'luneo_analytics',
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  excludePatterns: ['/api/', '/_next/', '/static/'],
};

class AnalyticsService {
  private static instance: AnalyticsService;
  private config: AnalyticsConfig;
  private eventQueue: TrackedEvent[] = [];
  private session: SessionData | null = null;
  private user: UserProperties | null = null;
  private anonymousId: string;
  private batchTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private deviceInfo: DeviceInfo | null = null;

  private constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.anonymousId = this.getOrCreateAnonymousId();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<AnalyticsConfig>): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService(config);
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize analytics
   */
  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.isInitialized = true;
    this.deviceInfo = this.getDeviceInfo();
    this.initSession();
    this.setupEventListeners();
    this.startBatchTimer();
    this.loadQueuedEvents();

    if (this.config.debug) {
      logger.info('Analytics initialized', {
        anonymousId: this.anonymousId,
        sessionId: this.session?.id,
      });
    }
  }

  /**
   * Track an event
   */
  public track(
    category: EventCategory,
    action: EventAction,
    options: {
      label?: string;
      value?: number;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    if (!this.config.enabled || typeof window === 'undefined') return;

    const event: TrackedEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      category,
      action,
      label: options.label,
      value: options.value,
      metadata: options.metadata,
      sessionId: this.session?.id || this.initSession(),
      userId: this.user?.id,
      anonymousId: this.anonymousId,
      deviceInfo: this.deviceInfo || this.getDeviceInfo(),
      pageInfo: this.getPageInfo(),
      referrer: document.referrer || undefined,
      utm: this.getUTMParams(),
    };

    this.eventQueue.push(event);
    this.updateSession();

    if (this.config.debug) {
      logger.debug('Event tracked', { category, action, ...options });
    }

    // Flush if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Track page view
   */
  public trackPageView(path?: string): void {
    if (!this.config.trackPageViews) return;

    this.track('page_view', 'page_enter', {
      label: path || window.location.pathname,
      metadata: {
        title: document.title,
        referrer: document.referrer,
      },
    });
  }

  /**
   * Track click event
   */
  public trackClick(element: string, metadata?: Record<string, any>): void {
    if (!this.config.trackClicks) return;

    this.track('user_action', 'click', {
      label: element,
      metadata,
    });
  }

  /**
   * Track form submission
   */
  public trackFormSubmit(formName: string, success: boolean, metadata?: Record<string, any>): void {
    if (!this.config.trackFormSubmissions) return;

    this.track('user_action', 'submit', {
      label: formName,
      value: success ? 1 : 0,
      metadata: { success, ...metadata },
    });
  }

  /**
   * Track error
   */
  public trackError(error: Error | string, metadata?: Record<string, any>): void {
    if (!this.config.trackErrors) return;

    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.track('error', 'error', {
      label: errorMessage,
      metadata: {
        stack: errorStack,
        ...metadata,
      },
    });
  }

  /**
   * Track performance metric
   */
  public trackPerformance(metric: string, value: number, metadata?: Record<string, any>): void {
    if (!this.config.trackPerformance) return;

    this.track('performance', 'render_time', {
      label: metric,
      value,
      metadata,
    });
  }

  /**
   * Track customization event
   */
  public trackCustomization(
    action: 'customizer_open' | 'customizer_close' | 'element_add' | 'element_modify' | 'element_delete' | 'color_change' | 'text_add' | 'image_upload' | 'template_select',
    metadata?: Record<string, any>
  ): void {
    this.track('customization', action, { metadata });
  }

  /**
   * Track commerce event
   */
  public trackCommerce(
    action: 'product_view' | 'add_to_cart' | 'remove_from_cart' | 'checkout_start' | 'checkout_complete' | 'purchase' | 'refund',
    options: {
      productId?: string;
      productName?: string;
      price?: number;
      quantity?: number;
      currency?: string;
      orderId?: string;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    this.track('commerce', action, {
      label: options.productName || options.productId,
      value: options.price,
      metadata: {
        productId: options.productId,
        productName: options.productName,
        price: options.price,
        quantity: options.quantity,
        currency: options.currency || 'EUR',
        orderId: options.orderId,
        ...options.metadata,
      },
    });
  }

  /**
   * Identify user
   */
  public identify(user: UserProperties): void {
    this.user = user;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${this.config.storageKey}_user`, JSON.stringify(user));
    }

    this.track('auth', 'login', {
      metadata: { userId: user.id, plan: user.plan },
    });

    if (this.config.debug) {
      logger.info('User identified', { userId: user.id });
    }
  }

  /**
   * Reset user (logout)
   */
  public reset(): void {
    this.user = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${this.config.storageKey}_user`);
    }

    this.track('auth', 'logout');
    this.initSession(); // Start new session

    if (this.config.debug) {
      logger.info('Analytics reset');
    }
  }

  /**
   * Flush event queue
   */
  public async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error('Failed to send events');
      }

      if (this.config.debug) {
        logger.debug('Events flushed', { count: events.length });
      }
    } catch (error) {
      // Re-queue events on failure
      this.eventQueue = [...events, ...this.eventQueue];
      this.saveQueuedEvents();
      
      logger.warn('Failed to flush events, will retry', { error });
    }
  }

  /**
   * Get session data
   */
  public getSession(): SessionData | null {
    return this.session;
  }

  /**
   * Get user data
   */
  public getUser(): UserProperties | null {
    return this.user;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private getOrCreateAnonymousId(): string {
    if (typeof window === 'undefined') return uuidv4();

    const stored = localStorage.getItem(`${this.config.storageKey}_aid`);
    if (stored) return stored;

    const newId = uuidv4();
    localStorage.setItem(`${this.config.storageKey}_aid`, newId);
    return newId;
  }

  private initSession(): string {
    const now = Date.now();
    const storedSession = this.getStoredSession();

    if (storedSession && now - storedSession.lastActivityTime < this.config.sessionTimeout) {
      this.session = {
        ...storedSession,
        lastActivityTime: now,
      };
    } else {
      this.session = {
        id: uuidv4(),
        startTime: now,
        lastActivityTime: now,
        pageViews: 0,
        events: 0,
        isNew: true,
      };
    }

    this.saveSession();
    return this.session.id;
  }

  private updateSession(): void {
    if (!this.session) return;

    this.session.lastActivityTime = Date.now();
    this.session.events++;
    this.saveSession();
  }

  private getStoredSession(): SessionData | null {
    if (typeof window === 'undefined') return null;

    const stored = sessionStorage.getItem(`${this.config.storageKey}_session`);
    return stored ? JSON.parse(stored) : null;
  }

  private saveSession(): void {
    if (typeof window === 'undefined' || !this.session) return;
    sessionStorage.setItem(`${this.config.storageKey}_session`, JSON.stringify(this.session));
  }

  private getDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return {
        type: 'desktop',
        os: 'unknown',
        browser: 'unknown',
        browserVersion: 'unknown',
        screenWidth: 0,
        screenHeight: 0,
        viewport: { width: 0, height: 0 },
        language: 'en',
        timezone: 'UTC',
      };
    }

    const ua = navigator.userAgent;
    const width = window.innerWidth;

    return {
      type: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
      os: this.getOS(ua),
      browser: this.getBrowser(ua),
      browserVersion: this.getBrowserVersion(ua),
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  private getOS(ua: string): string {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'unknown';
  }

  private getBrowser(ua: string): string {
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg')) return 'Edge';
    return 'unknown';
  }

  private getBrowserVersion(ua: string): string {
    const match = ua.match(/(Chrome|Safari|Firefox|Edg)\/(\d+)/);
    return match ? match[2] : 'unknown';
  }

  private getPageInfo(): PageInfo {
    if (typeof window === 'undefined') {
      return { url: '', path: '', title: '' };
    }

    const url = new URL(window.location.href);
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    return {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      hash: window.location.hash || undefined,
      query: Object.keys(query).length > 0 ? query : undefined,
    };
  }

  private getUTMParams(): UTMParams | undefined {
    if (typeof window === 'undefined') return undefined;

    const params = new URLSearchParams(window.location.search);
    const utm: UTMParams = {};

    if (params.get('utm_source')) utm.source = params.get('utm_source')!;
    if (params.get('utm_medium')) utm.medium = params.get('utm_medium')!;
    if (params.get('utm_campaign')) utm.campaign = params.get('utm_campaign')!;
    if (params.get('utm_term')) utm.term = params.get('utm_term')!;
    if (params.get('utm_content')) utm.content = params.get('utm_content')!;

    return Object.keys(utm).length > 0 ? utm : undefined;
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });

    // Before unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Scroll depth tracking
    if (this.config.trackScrollDepth) {
      this.setupScrollTracking();
    }

    // Error tracking
    if (this.config.trackErrors) {
      window.addEventListener('error', (event) => {
        this.trackError(event.error || event.message);
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.trackError(`Unhandled Promise Rejection: ${event.reason}`);
      });
    }

    // Performance tracking
    if (this.config.trackPerformance) {
      this.setupPerformanceTracking();
    }
  }

  private setupScrollTracking(): void {
    let maxScroll = 0;
    const thresholds = [25, 50, 75, 90, 100];
    const tracked = new Set<number>();

    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;

        thresholds.forEach((threshold) => {
          if (scrollPercent >= threshold && !tracked.has(threshold)) {
            tracked.add(threshold);
            this.track('engagement', 'scroll_depth', {
              label: `${threshold}%`,
              value: threshold,
            });
          }
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  private setupPerformanceTracking(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
          
          if (navigation) {
            this.trackPerformance('page_load', navigation.loadEventEnd - navigation.startTime, {
              dns: navigation.domainLookupEnd - navigation.domainLookupStart,
              tcp: navigation.connectEnd - navigation.connectStart,
              ttfb: navigation.responseStart - navigation.requestStart,
              dom: navigation.domContentLoadedEventEnd - navigation.startTime,
            });
          }
        }, 0);
      });
    }
  }

  private startBatchTimer(): void {
    if (this.batchTimer) return;

    this.batchTimer = setInterval(() => {
      this.flush();
    }, this.config.batchInterval);
  }

  private saveQueuedEvents(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        `${this.config.storageKey}_queue`,
        JSON.stringify(this.eventQueue.slice(0, 100)) // Max 100 events
      );
    } catch (e) {
      // Storage quota exceeded, clear old events
      localStorage.removeItem(`${this.config.storageKey}_queue`);
    }
  }

  private loadQueuedEvents(): void {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(`${this.config.storageKey}_queue`);
    if (stored) {
      try {
        const events = JSON.parse(stored);
        this.eventQueue = [...events, ...this.eventQueue];
        localStorage.removeItem(`${this.config.storageKey}_queue`);
      } catch (e) {
        localStorage.removeItem(`${this.config.storageKey}_queue`);
      }
    }
  }
}

// Export singleton
export const analytics = AnalyticsService.getInstance();
export default AnalyticsService;


