/**
 * Analytics Types
 * Types TypeScript pour le système de tracking
 */

// Event Categories
export type EventCategory =
  | 'page_view'
  | 'user_action'
  | 'design'
  | 'customization'
  | 'commerce'
  | 'engagement'
  | 'error'
  | 'performance'
  | 'auth'
  | 'system';

// Event Actions par catégorie
export type EventAction =
  // Page views
  | 'page_enter'
  | 'page_exit'
  | 'scroll_depth'
  // User actions
  | 'click'
  | 'hover'
  | 'focus'
  | 'blur'
  | 'submit'
  | 'download'
  | 'share'
  | 'copy'
  // Design
  | 'design_create'
  | 'design_edit'
  | 'design_save'
  | 'design_delete'
  | 'design_export'
  | 'design_duplicate'
  // Customization
  | 'customizer_open'
  | 'customizer_close'
  | 'element_add'
  | 'element_modify'
  | 'element_delete'
  | 'color_change'
  | 'text_add'
  | 'image_upload'
  | 'template_select'
  // Commerce
  | 'product_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_start'
  | 'checkout_complete'
  | 'purchase'
  | 'refund'
  // Engagement
  | 'video_play'
  | 'video_pause'
  | 'video_complete'
  | 'tutorial_start'
  | 'tutorial_complete'
  | 'feature_discover'
  // Auth
  | 'login'
  | 'logout'
  | 'register'
  | 'password_reset'
  | 'oauth_start'
  | 'oauth_complete'
  // Performance
  | 'page_load'
  | 'api_call'
  | 'render_time'
  | 'interaction_delay'
  // Errors
  | 'error'
  | 'warning'
  | 'api_error'
  | 'validation_error';

// Base event interface
export interface AnalyticsEvent {
  id?: string;
  timestamp: number;
  category: EventCategory;
  action: EventAction;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

// Extended event with context
export interface TrackedEvent extends AnalyticsEvent {
  sessionId: string;
  userId?: string;
  anonymousId: string;
  deviceInfo: DeviceInfo;
  pageInfo: PageInfo;
  referrer?: string;
  utm?: UTMParams;
}

// Device information
export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  browserVersion: string;
  screenWidth: number;
  screenHeight: number;
  viewport: {
    width: number;
    height: number;
  };
  language: string;
  timezone: string;
}

// Page information
export interface PageInfo {
  url: string;
  path: string;
  title: string;
  hash?: string;
  query?: Record<string, string>;
}

// UTM parameters
export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

// User properties
export interface UserProperties {
  id?: string;
  email?: string;
  name?: string;
  plan?: string;
  company?: string;
  createdAt?: string;
  traits?: Record<string, any>;
}

// Session data
export interface SessionData {
  id: string;
  startTime: number;
  lastActivityTime: number;
  pageViews: number;
  events: number;
  isNew: boolean;
}

// Analytics configuration
export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  trackPageViews: boolean;
  trackClicks: boolean;
  trackScrollDepth: boolean;
  trackFormSubmissions: boolean;
  trackErrors: boolean;
  trackPerformance: boolean;
  batchSize: number;
  batchInterval: number;
  storageKey: string;
  sessionTimeout: number;
  excludePatterns: string[];
}

// Event filter
export interface EventFilter {
  categories?: EventCategory[];
  actions?: EventAction[];
  startTime?: number;
  endTime?: number;
  userId?: string;
  sessionId?: string;
}

// Aggregated metrics
export interface AggregatedMetrics {
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  eventsByCategory: Record<EventCategory, number>;
  eventsByAction: Record<string, number>;
  topPages: { path: string; views: number }[];
  topEvents: { action: string; count: number }[];
  avgSessionDuration: number;
  bounceRate: number;
}


