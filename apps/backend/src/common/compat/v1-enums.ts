/**
 * V1 Compatibility Layer - Enum aliases
 * Maps old V1 enum values to V2 equivalents so legacy code can run
 */

export const UserRole = {
  PLATFORM_ADMIN: 'ADMIN' as const,
  BRAND_ADMIN: 'ADMIN' as const,
  BRAND_USER: 'USER' as const,
  CONSUMER: 'USER' as const,
  FABRICATOR: 'USER' as const,
  USER: 'USER' as const,
  ADMIN: 'ADMIN' as const,
} as const;

export const OrderStatus = {
  PENDING: 'PENDING' as const,
  PAID: 'PAID' as const,
  PROCESSING: 'PROCESSING' as const,
  SHIPPED: 'SHIPPED' as const,
  DELIVERED: 'DELIVERED' as const,
  CANCELLED: 'CANCELLED' as const,
  REFUNDED: 'REFUNDED' as const,
} as const;

export const DesignStatus = {
  DRAFT: 'DRAFT' as const,
  PROCESSING: 'PROCESSING' as const,
  COMPLETED: 'COMPLETED' as const,
  FAILED: 'FAILED' as const,
  PUBLISHED: 'PUBLISHED' as const,
} as const;

export const BrandStatus = {
  ACTIVE: 'ACTIVE' as const,
  SUSPENDED: 'SUSPENDED' as const,
  TRIAL: 'TRIAL' as const,
} as const;

export const ProductStatus = {
  DRAFT: 'DRAFT' as const,
  ACTIVE: 'ACTIVE' as const,
  ARCHIVED: 'ARCHIVED' as const,
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
export type DesignStatus = (typeof DesignStatus)[keyof typeof DesignStatus];
export type BrandStatus = (typeof BrandStatus)[keyof typeof BrandStatus];
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

// Additional V1 enums used by legacy code
export const ChurnRisk = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', CRITICAL: 'CRITICAL' } as const;
export const SubscriptionPlan = { FREE: 'FREE', STARTER: 'STARTER', PRO: 'PRO', BUSINESS: 'BUSINESS', ENTERPRISE: 'ENTERPRISE' } as const;
export const SubscriptionStatus = { ACTIVE: 'ACTIVE', TRIALING: 'TRIALING', PAST_DUE: 'PAST_DUE', CANCELED: 'CANCELED', PAUSED: 'PAUSED' } as const;
export const TicketPriority = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', URGENT: 'URGENT' } as const;
export const TicketStatus = { OPEN: 'OPEN', IN_PROGRESS: 'IN_PROGRESS', WAITING: 'WAITING', RESOLVED: 'RESOLVED', CLOSED: 'CLOSED' } as const;
export const TicketCategory = { TECHNICAL: 'TECHNICAL', BILLING: 'BILLING', FEATURE: 'FEATURE', OTHER: 'OTHER' } as const;
export const TicketSource = { EMAIL: 'EMAIL', CHAT: 'CHAT', PHONE: 'PHONE', WEB: 'WEB' } as const;
export const PaymentStatus = { PENDING: 'PENDING', SUCCEEDED: 'SUCCEEDED', FAILED: 'FAILED', REFUNDED: 'REFUNDED' } as const;
export const ReferralStatus = { PENDING: 'PENDING', ACTIVE: 'ACTIVE', COMPLETED: 'COMPLETED', EXPIRED: 'EXPIRED' } as const;
export const GenerationStatus = { PENDING: 'PENDING', PROCESSING: 'PROCESSING', COMPLETED: 'COMPLETED', FAILED: 'FAILED' } as const;
export const AIGenerationStatus = { PENDING: 'PENDING', PROCESSING: 'PROCESSING', COMPLETED: 'COMPLETED', FAILED: 'FAILED' } as const;
export const AIGenerationType = { IMAGE: 'IMAGE', TEXT: 'TEXT', VIDEO: 'VIDEO', MODEL_3D: 'MODEL_3D' } as const;
export const AIResponseStatus = { SUCCESS: 'SUCCESS', ERROR: 'ERROR', RATE_LIMITED: 'RATE_LIMITED' } as const;
export const AlertSeverity = { INFO: 'INFO', WARNING: 'WARNING', ERROR: 'ERROR', CRITICAL: 'CRITICAL' } as const;
export const AlertStatus = { ACTIVE: 'ACTIVE', ACKNOWLEDGED: 'ACKNOWLEDGED', RESOLVED: 'RESOLVED' } as const;
export const AutomationStatus = { ACTIVE: 'ACTIVE', PAUSED: 'PAUSED', DRAFT: 'DRAFT' } as const;
export const AutomationRunStatus = { PENDING: 'PENDING', RUNNING: 'RUNNING', COMPLETED: 'COMPLETED', FAILED: 'FAILED' } as const;
export const EmailTemplateCategory = { WELCOME: 'WELCOME', PASSWORD_RESET: 'PASSWORD_RESET', NOTIFICATION: 'NOTIFICATION', MARKETING: 'MARKETING' } as const;
export const EscalationLevel = { L1: 'L1', L2: 'L2', L3: 'L3', MANAGER: 'MANAGER' } as const;
export const GrowthPotential = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' } as const;
export const OrionAgentStatus = { ACTIVE: 'ACTIVE', PAUSED: 'PAUSED', ERROR: 'ERROR' } as const;
export const OrionAgentType = { ZEUS: 'ZEUS', ATHENA: 'ATHENA', APOLLO: 'APOLLO', ARTEMIS: 'ARTEMIS', HERMES: 'HERMES', HADES: 'HADES', PROMETHEUS: 'PROMETHEUS' } as const;
export const ResourceType = { CPU: 'CPU', MEMORY: 'MEMORY', DISK: 'DISK', NETWORK: 'NETWORK' } as const;
export const ServiceHealthStatus = { HEALTHY: 'HEALTHY', DEGRADED: 'DEGRADED', DOWN: 'DOWN' } as const;
export const SyncDirection = { IMPORT: 'IMPORT', EXPORT: 'EXPORT', BIDIRECTIONAL: 'BIDIRECTIONAL' } as const;
export const SyncLogStatus = { SUCCESS: 'SUCCESS', FAILED: 'FAILED', PARTIAL: 'PARTIAL' } as const;
export const SyncLogType = { PRODUCTS: 'PRODUCTS', ORDERS: 'ORDERS', CUSTOMERS: 'CUSTOMERS' } as const;
export const VideoStatus = { PENDING: 'PENDING', PROCESSING: 'PROCESSING', COMPLETED: 'COMPLETED', FAILED: 'FAILED' } as const;
