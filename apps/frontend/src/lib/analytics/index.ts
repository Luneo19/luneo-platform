/**
 * Analytics Module
 * A-006: Export centralisé du système de tracking
 */

// Core service
export { analytics, default as AnalyticsService } from './AnalyticsService';

// React hooks
export { 
  useAnalytics, 
  useTrackClick, 
  useTrackVisibility, 
  useTrackTime,
  default as useAnalyticsDefault 
} from './useAnalytics';

// Types
export type {
  EventCategory,
  EventAction,
  AnalyticsEvent,
  TrackedEvent,
  DeviceInfo,
  PageInfo,
  UTMParams,
  UserProperties,
  SessionData,
  AnalyticsConfig,
  EventFilter,
  AggregatedMetrics,
} from './types';

// Provider (for context if needed)
export { AnalyticsProvider, useAnalyticsContext } from './AnalyticsProvider';


