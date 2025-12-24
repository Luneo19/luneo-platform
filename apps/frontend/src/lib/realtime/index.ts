/**
 * Realtime Module
 * A-010: Export centralisé du système temps réel
 */

export { useRealtime, default as useRealtimeDefault } from './useRealtime';

export type {
  RealtimeEventType,
  RealtimeEvent,
  MetricsUpdateData,
  DesignEventData,
  OrderEventData,
  NotificationEventData,
  UserActivityData,
  ConnectionState,
  RealtimeConfig,
} from './types';


