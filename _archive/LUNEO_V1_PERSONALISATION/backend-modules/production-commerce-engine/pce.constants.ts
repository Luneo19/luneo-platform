import { PipelineStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Pipeline Stages
// ---------------------------------------------------------------------------

export const PIPELINE_STAGES = {
  VALIDATION: 'VALIDATION',
  RENDER: 'RENDER',
  PRODUCTION: 'PRODUCTION',
  QUALITY_CHECK: 'QUALITY_CHECK',
  FULFILLMENT: 'FULFILLMENT',
  SHIPPING: 'SHIPPING',
  DELIVERY: 'DELIVERY',
} as const;

export type PipelineStageId = (typeof PIPELINE_STAGES)[keyof typeof PIPELINE_STAGES];

export const TERMINAL_STAGES: readonly string[] = [
  PipelineStatus.COMPLETED,
  PipelineStatus.FAILED,
  PipelineStatus.CANCELLED,
];

export const STAGE_ORDER: readonly PipelineStageId[] = [
  PIPELINE_STAGES.VALIDATION,
  PIPELINE_STAGES.RENDER,
  PIPELINE_STAGES.PRODUCTION,
  PIPELINE_STAGES.QUALITY_CHECK,
  PIPELINE_STAGES.FULFILLMENT,
  PIPELINE_STAGES.SHIPPING,
  PIPELINE_STAGES.DELIVERY,
];

export const STAGE_ESTIMATED_HOURS: Record<PipelineStageId, number> = {
  [PIPELINE_STAGES.VALIDATION]: 0.5,
  [PIPELINE_STAGES.RENDER]: 1,
  [PIPELINE_STAGES.PRODUCTION]: 48,
  [PIPELINE_STAGES.QUALITY_CHECK]: 2,
  [PIPELINE_STAGES.FULFILLMENT]: 4,
  [PIPELINE_STAGES.SHIPPING]: 72,
  [PIPELINE_STAGES.DELIVERY]: 24,
};

// ---------------------------------------------------------------------------
// Queues
// ---------------------------------------------------------------------------

export const PCE_QUEUES = {
  PIPELINE: 'pce:pipeline',
  FULFILLMENT: 'pce:fulfillment',
  RENDER: 'pce:render',
  SYNC: 'pce:sync',
  PRODUCTION: 'pce:production',
  WEBHOOKS: 'pce:webhooks',
  NOTIFICATIONS: 'pce:notifications',
} as const;

export const PCE_QUEUE_DEFAULTS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5_000 },
  removeOnComplete: { count: 1_000 },
  removeOnFail: { count: 5_000 },
} as const;

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const PCE_EVENTS = {
  ORDER_CREATED: 'pce.order.created',
  ORDER_PAID: 'pce.order.paid',
  ORDER_CANCELLED: 'pce.order.cancelled',

  PIPELINE_CREATED: 'pce.pipeline.created',
  PIPELINE_STARTED: 'pce.pipeline.started',
  PIPELINE_STAGE_STARTED: 'pce.pipeline.stage.started',
  PIPELINE_STAGE_COMPLETED: 'pce.pipeline.stage.completed',
  PIPELINE_STAGE_FAILED: 'pce.pipeline.stage.failed',
  PIPELINE_COMPLETED: 'pce.pipeline.completed',
  PIPELINE_FAILED: 'pce.pipeline.failed',
  PIPELINE_CANCELLED: 'pce.pipeline.cancelled',
  PIPELINE_ROLLBACK: 'pce.pipeline.rollback',

  RENDER_QUEUED: 'pce.render.queued',
  RENDER_STARTED: 'pce.render.started',
  RENDER_COMPLETED: 'pce.render.completed',
  RENDER_FAILED: 'pce.render.failed',

  PRODUCTION_SUBMITTED: 'pce.production.submitted',
  PRODUCTION_ACCEPTED: 'pce.production.accepted',
  PRODUCTION_COMPLETED: 'pce.production.completed',
  PRODUCTION_SHIPPED: 'pce.production.shipped',
  PRODUCTION_FAILED: 'pce.production.failed',

  FULFILLMENT_CREATED: 'pce.fulfillment.created',
  FULFILLMENT_SHIPPED: 'pce.fulfillment.shipped',
  FULFILLMENT_DELIVERED: 'pce.fulfillment.delivered',

  SYNC_STARTED: 'pce.sync.started',
  SYNC_COMPLETED: 'pce.sync.completed',
  SYNC_FAILED: 'pce.sync.failed',

  WEBHOOK_RECEIVED: 'pce.webhook.received',
  WEBHOOK_PROCESSED: 'pce.webhook.processed',
  WEBHOOK_FAILED: 'pce.webhook.failed',

  RETURN_REQUESTED: 'pce.return.requested',
  RETURN_APPROVED: 'pce.return.approved',
  RETURN_RECEIVED: 'pce.return.received',
  RETURN_REFUNDED: 'pce.return.refunded',
} as const;

// ---------------------------------------------------------------------------
// Permissions & Roles
// ---------------------------------------------------------------------------

export const PCE_PERMISSIONS = {
  DASHBOARD_VIEW: 'pce:dashboard:view',
  PIPELINE_VIEW: 'pce:pipeline:view',
  PIPELINE_MANAGE: 'pce:pipeline:manage',
  ORDER_PROCESS: 'pce:order:process',
  QUEUE_VIEW: 'pce:queue:view',
  QUEUE_MANAGE: 'pce:queue:manage',
  FULFILLMENT_VIEW: 'pce:fulfillment:view',
  FULFILLMENT_MANAGE: 'pce:fulfillment:manage',
  RETURN_VIEW: 'pce:return:view',
  RETURN_MANAGE: 'pce:return:manage',
  ECOMMERCE_VIEW: 'pce:ecommerce:view',
  ECOMMERCE_MANAGE: 'pce:ecommerce:manage',
  MANUFACTURING_VIEW: 'pce:manufacturing:view',
  MANUFACTURING_MANAGE: 'pce:manufacturing:manage',
  RENDER_VIEW: 'pce:render:view',
  RENDER_MANAGE: 'pce:render:manage',
  SHIPPING_VIEW: 'pce:shipping:view',
  SHIPPING_MANAGE: 'pce:shipping:manage',
  ADMIN: 'pce:admin',
} as const;

export const PCE_ROLES = {
  FREE: {
    permissions: [PCE_PERMISSIONS.DASHBOARD_VIEW, PCE_PERMISSIONS.PIPELINE_VIEW],
  },
  STARTER: {
    permissions: [
      PCE_PERMISSIONS.DASHBOARD_VIEW,
      PCE_PERMISSIONS.PIPELINE_VIEW,
      PCE_PERMISSIONS.ORDER_PROCESS,
      PCE_PERMISSIONS.FULFILLMENT_VIEW,
    ],
  },
  PROFESSIONAL: {
    permissions: [
      PCE_PERMISSIONS.DASHBOARD_VIEW,
      PCE_PERMISSIONS.PIPELINE_VIEW,
      PCE_PERMISSIONS.PIPELINE_MANAGE,
      PCE_PERMISSIONS.ORDER_PROCESS,
      PCE_PERMISSIONS.QUEUE_VIEW,
      PCE_PERMISSIONS.FULFILLMENT_VIEW,
      PCE_PERMISSIONS.FULFILLMENT_MANAGE,
      PCE_PERMISSIONS.RETURN_VIEW,
      PCE_PERMISSIONS.RETURN_MANAGE,
      PCE_PERMISSIONS.ECOMMERCE_VIEW,
      PCE_PERMISSIONS.ECOMMERCE_MANAGE,
      PCE_PERMISSIONS.RENDER_VIEW,
      PCE_PERMISSIONS.RENDER_MANAGE,
    ],
  },
  BUSINESS: {
    permissions: [
      PCE_PERMISSIONS.DASHBOARD_VIEW,
      PCE_PERMISSIONS.PIPELINE_VIEW,
      PCE_PERMISSIONS.PIPELINE_MANAGE,
      PCE_PERMISSIONS.ORDER_PROCESS,
      PCE_PERMISSIONS.QUEUE_VIEW,
      PCE_PERMISSIONS.QUEUE_MANAGE,
      PCE_PERMISSIONS.FULFILLMENT_VIEW,
      PCE_PERMISSIONS.FULFILLMENT_MANAGE,
      PCE_PERMISSIONS.RETURN_VIEW,
      PCE_PERMISSIONS.RETURN_MANAGE,
      PCE_PERMISSIONS.ECOMMERCE_VIEW,
      PCE_PERMISSIONS.ECOMMERCE_MANAGE,
      PCE_PERMISSIONS.MANUFACTURING_VIEW,
      PCE_PERMISSIONS.MANUFACTURING_MANAGE,
      PCE_PERMISSIONS.RENDER_VIEW,
      PCE_PERMISSIONS.RENDER_MANAGE,
      PCE_PERMISSIONS.SHIPPING_VIEW,
      PCE_PERMISSIONS.SHIPPING_MANAGE,
    ],
  },
  ENTERPRISE: {
    permissions: Object.values(PCE_PERMISSIONS),
  },
  ADMIN: {
    permissions: Object.values(PCE_PERMISSIONS),
  },
} as const;

// ---------------------------------------------------------------------------
// Plan-based Limits
// ---------------------------------------------------------------------------

export const PCE_LIMITS = {
  FREE: {
    maxOrdersPerMonth: 10,
    maxRendersPerMonth: 50,
    maxEcommerceConnections: 1,
    maxPODProviders: 1,
    maxShippingCarriers: 1,
    maxConcurrentPipelines: 2,
  },
  STARTER: {
    maxOrdersPerMonth: 100,
    maxRendersPerMonth: 500,
    maxEcommerceConnections: 2,
    maxPODProviders: 2,
    maxShippingCarriers: 3,
    maxConcurrentPipelines: 5,
  },
  PROFESSIONAL: {
    maxOrdersPerMonth: 1_000,
    maxRendersPerMonth: 5_000,
    maxEcommerceConnections: 5,
    maxPODProviders: 5,
    maxShippingCarriers: 10,
    maxConcurrentPipelines: 20,
  },
  BUSINESS: {
    maxOrdersPerMonth: 10_000,
    maxRendersPerMonth: 50_000,
    maxEcommerceConnections: 20,
    maxPODProviders: 10,
    maxShippingCarriers: 20,
    maxConcurrentPipelines: 50,
  },
  ENTERPRISE: {
    maxOrdersPerMonth: -1, // unlimited
    maxRendersPerMonth: -1,
    maxEcommerceConnections: -1,
    maxPODProviders: -1,
    maxShippingCarriers: -1,
    maxConcurrentPipelines: -1,
  },
} as const;

// ---------------------------------------------------------------------------
// Supported Connectors & Providers
// ---------------------------------------------------------------------------

export const ECOMMERCE_CONNECTORS = [
  'shopify',
  'woocommerce',
  'magento',
  'prestashop',
  'bigcommerce',
  'squarespace',
  'etsy',
  'amazon',
] as const;

export type EcommerceConnectorType = (typeof ECOMMERCE_CONNECTORS)[number];

export const POD_PROVIDERS = [
  'printful',
  'gooten',
  'spod',
  'gelato',
  'prodigi',
  'printify',
  'custom',
] as const;

export type PODProviderType = (typeof POD_PROVIDERS)[number];

export const SHIPPING_CARRIERS = [
  'dhl',
  'ups',
  'fedex',
  'usps',
  'dpd',
  'la_poste',
  'swiss_post',
  'easypost',
] as const;

export type ShippingCarrierType = (typeof SHIPPING_CARRIERS)[number];

export const RENDER_FORMATS = {
  IMAGE: ['png', 'jpeg', 'webp', 'tiff'] as const,
  VECTOR: ['svg', 'eps', 'ai'] as const,
  DOCUMENT: ['pdf'] as const,
  CAD: ['dxf'] as const,
  THREE_D: ['gltf', 'glb', 'usdz', 'stl', 'obj'] as const,
} as const;

export const COLOR_PROFILES = {
  SRGB: 'sRGB',
  ADOBE_RGB: 'AdobeRGB',
  CMYK_FOGRA39: 'CMYK-FOGRA39',
  CMYK_US_WEB: 'CMYK-USWebCoated',
} as const;

// ---------------------------------------------------------------------------
// Order States & Transitions
// ---------------------------------------------------------------------------

export const ORDER_STATES = {
  CREATED: 'CREATED',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  PROCESSING: 'PROCESSING',
  PARTIALLY_FULFILLED: 'PARTIALLY_FULFILLED',
  FULFILLED: 'FULFILLED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export const ORDER_TRANSITIONS: Record<string, string[]> = {
  [ORDER_STATES.CREATED]: [ORDER_STATES.PENDING_PAYMENT, ORDER_STATES.CANCELLED],
  [ORDER_STATES.PENDING_PAYMENT]: [ORDER_STATES.PAID, ORDER_STATES.CANCELLED],
  [ORDER_STATES.PAID]: [ORDER_STATES.PROCESSING, ORDER_STATES.CANCELLED, ORDER_STATES.REFUNDED],
  [ORDER_STATES.PROCESSING]: [ORDER_STATES.PARTIALLY_FULFILLED, ORDER_STATES.FULFILLED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.PARTIALLY_FULFILLED]: [ORDER_STATES.FULFILLED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.FULFILLED]: [ORDER_STATES.SHIPPED],
  [ORDER_STATES.SHIPPED]: [ORDER_STATES.DELIVERED],
  [ORDER_STATES.DELIVERED]: [ORDER_STATES.COMPLETED, ORDER_STATES.REFUNDED],
  [ORDER_STATES.COMPLETED]: [ORDER_STATES.REFUNDED],
};

// ---------------------------------------------------------------------------
// Webhook Events
// ---------------------------------------------------------------------------

export const PCE_WEBHOOK_EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_PAID: 'order.paid',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_FULFILLED: 'order.fulfilled',
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  INVENTORY_UPDATED: 'inventory.updated',
  REFUND_CREATED: 'refund.created',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  FULFILLMENT_CREATED: 'fulfillment.created',
  FULFILLMENT_UPDATED: 'fulfillment.updated',
  APP_UNINSTALLED: 'app.uninstalled',
} as const;

export const PCE_MAX_RETRIES = 3;
export const PCE_RETRY_DELAY_MS = 60_000;
