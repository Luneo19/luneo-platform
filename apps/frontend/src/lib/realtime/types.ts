/**
 * Real-time Types
 * A-010: Types pour les mises à jour en temps réel
 */

export type RealtimeEventType =
  | 'metrics_update'
  | 'design_created'
  | 'design_updated'
  | 'order_created'
  | 'order_status_changed'
  | 'notification'
  | 'user_activity'
  | 'system_alert'
  | 'conversion'
  | 'error';

export interface RealtimeEvent<T = unknown> {
  id: string;
  type: RealtimeEventType;
  timestamp: number;
  data: T;
  channel?: string;
}

export interface MetricsUpdateData {
  visitors: number;
  conversions: number;
  revenue: number;
  designs: number;
  trend: 'up' | 'down' | 'stable';
}

export interface DesignEventData {
  designId: string;
  name: string;
  userId: string;
  productId?: string;
  thumbnail?: string;
  action: 'created' | 'updated' | 'deleted' | 'exported';
}

export interface OrderEventData {
  orderId: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  amount: number;
  currency: string;
  items: number;
  customerId?: string;
}

export interface NotificationEventData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
}

export interface UserActivityData {
  userId: string;
  action: string;
  page: string;
  metadata?: Record<string, any>;
}

export interface ConnectionState {
  isConnected: boolean;
  lastEventTime: number | null;
  reconnectAttempts: number;
  error: string | null;
}

export interface RealtimeConfig {
  enabled: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  channels: string[];
}


