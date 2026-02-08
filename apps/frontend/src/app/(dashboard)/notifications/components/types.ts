export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'customization' | 'system' | 'promo' | 'feature' | 'achievement' | 'payment' | 'design';
  title: string;
  message: string;
  read: boolean;
  archived: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  read_at?: string;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, unknown>;
  resource_type?: string;
  resource_id?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  archived: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  readRate: number;
  avgReadTime: number;
}

export interface NotificationPreferences {
  email: { orders: boolean; customizations: boolean; system: boolean; marketing: boolean };
  push: { orders: boolean; customizations: boolean; system: boolean };
  inApp: { orders: boolean; customizations: boolean; system: boolean };
  sound: boolean;
  doNotDisturb: { enabled: boolean; startTime?: string; endTime?: string };
}

export type NotificationsTab = 'all' | 'unread' | 'archived' | 'preferences';
