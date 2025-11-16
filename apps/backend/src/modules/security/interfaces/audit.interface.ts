export enum AuditEventType {
  // Authentication
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  LOGIN_FAILED = 'auth.login_failed',
  PASSWORD_CHANGED = 'auth.password_changed',
  PASSWORD_RESET = 'auth.password_reset',

  // User Management
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_ROLE_CHANGED = 'user.role_changed',
  USER_INVITED = 'user.invited',

  // Brand Management
  BRAND_CREATED = 'brand.created',
  BRAND_UPDATED = 'brand.updated',
  BRAND_DELETED = 'brand.deleted',

  // Product Management
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  PRODUCT_PUBLISHED = 'product.published',

  // Design Management
  DESIGN_CREATED = 'design.created',
  DESIGN_UPDATED = 'design.updated',
  DESIGN_DELETED = 'design.deleted',
  DESIGN_APPROVED = 'design.approved',

  // Order Management
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_REFUNDED = 'order.refunded',

  // Billing
  BILLING_UPDATED = 'billing.updated',
  INVOICE_GENERATED = 'billing.invoice_generated',
  PAYMENT_SUCCEEDED = 'billing.payment_succeeded',
  PAYMENT_FAILED = 'billing.payment_failed',

  // Settings
  SETTINGS_UPDATED = 'settings.updated',

  // Integrations
  INTEGRATION_CREATED = 'integration.created',
  INTEGRATION_UPDATED = 'integration.updated',
  INTEGRATION_DELETED = 'integration.deleted',
  INTEGRATION_SYNCED = 'integration.synced',

  // API & Security
  API_KEY_CREATED = 'api.key_created',
  API_KEY_DELETED = 'api.key_deleted',
  WEBHOOK_CREATED = 'webhook.created',
  WEBHOOK_DELETED = 'webhook.deleted',
  ACCESS_DENIED = 'security.access_denied',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit_exceeded',

  // GDPR
  DATA_EXPORTED = 'gdpr.data_exported',
  DATA_DELETED = 'gdpr.data_deleted',
  CONSENT_GIVEN = 'gdpr.consent_given',
  CONSENT_WITHDRAWN = 'gdpr.consent_withdrawn',
}

export type AuditMetadata = Record<string, unknown>;

export interface AuditLogRecord {
  id: string;
  eventType: AuditEventType;
  userId: string;
  userEmail: string | null;
  brandId: string | null;
  resourceType: string;
  resourceId: string;
  action: string;
  success: boolean;
  metadata: AuditMetadata | null;
  timestamp: Date;
  ipAddress: string | null;
  userAgent: string | null;
  errorMessage: string | null;
}

export interface AuditLogCreateInput {
  eventType: AuditEventType;
  action: string;
  success: boolean;
  userId?: string;
  userEmail?: string;
  brandId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: AuditMetadata;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
  timestamp?: Date;
}

export interface AuditContext {
  userId?: string;
  userEmail?: string;
  brandId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: AuditMetadata;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilters {
  userId?: string;
  brandId?: string;
  eventType?: AuditEventType;
  resourceType?: string;
  resourceId?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface AuditSearchQuery extends AuditLogFilters {
  limit?: number;
  offset?: number;
}

export interface AuditSearchResult {
  logs: AuditLogRecord[];
  total: number;
}

export interface AuditStatistics {
  period: {
    days: number;
    startDate: Date;
    endDate: Date;
  };
  total: number;
  success: number;
  failures: number;
  successRate: number;
  topEvents: Array<{ eventType: AuditEventType; count: number }>;
}

export type AuditAlertType = 'multiple_failures' | 'repeated_access_denied';
export type AuditAlertSeverity = 'low' | 'medium' | 'high';

export interface AuditAlert {
  type: AuditAlertType;
  severity: AuditAlertSeverity;
  message: string;
  count: number;
}
