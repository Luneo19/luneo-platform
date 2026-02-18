/**
 * Configurator 3D Module Constants
 * Permissions, roles, rate limits, and validation limits
 */

// =============================================================================
// PERMISSIONS (30+ granular permissions)
// =============================================================================

export const CONFIGURATOR_3D_PERMISSIONS = {
  // Configuration CRUD
  CONFIGURATION_CREATE: 'configuration:create',
  CONFIGURATION_READ: 'configuration:read',
  CONFIGURATION_UPDATE: 'configuration:update',
  CONFIGURATION_DELETE: 'configuration:delete',
  CONFIGURATION_CLONE: 'configuration:clone',
  CONFIGURATION_PUBLISH: 'configuration:publish',

  // Component CRUD
  COMPONENT_CREATE: 'component:create',
  COMPONENT_READ: 'component:read',
  COMPONENT_UPDATE: 'component:update',
  COMPONENT_DELETE: 'component:delete',
  COMPONENT_REORDER: 'component:reorder',

  // Option CRUD
  OPTION_CREATE: 'option:create',
  OPTION_READ: 'option:read',
  OPTION_UPDATE: 'option:update',
  OPTION_DELETE: 'option:delete',
  OPTION_BULK_CREATE: 'option:bulk-create',

  // Rules CRUD
  RULE_CREATE: 'rule:create',
  RULE_READ: 'rule:read',
  RULE_UPDATE: 'rule:update',
  RULE_DELETE: 'rule:delete',

  // Pricing
  PRICING_READ: 'pricing:read',
  PRICING_UPDATE: 'pricing:update',

  // Sessions
  SESSION_CREATE: 'session:create',
  SESSION_READ: 'session:read',
  SESSION_READ_ALL: 'session:read-all',
  SESSION_DELETE: 'session:delete',

  // Export
  EXPORT_PDF: 'export:pdf',
  EXPORT_AR: 'export:ar',
  EXPORT_3D: 'export:3d',

  // Analytics
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_EXPORT: 'analytics:export',

  // Admin
  ADMIN_ALL: 'admin:all',
} as const;

export type Configurator3DPermission =
  (typeof CONFIGURATOR_3D_PERMISSIONS)[keyof typeof CONFIGURATOR_3D_PERMISSIONS];

// =============================================================================
// ROLES (role-to-permission mappings with hierarchy)
// VIEWER < EDITOR < MANAGER < ADMIN
// =============================================================================

const VIEWER_PERMISSIONS: Configurator3DPermission[] = [
  CONFIGURATOR_3D_PERMISSIONS.CONFIGURATION_READ,
  CONFIGURATOR_3D_PERMISSIONS.COMPONENT_READ,
  CONFIGURATOR_3D_PERMISSIONS.OPTION_READ,
  CONFIGURATOR_3D_PERMISSIONS.RULE_READ,
  CONFIGURATOR_3D_PERMISSIONS.PRICING_READ,
  CONFIGURATOR_3D_PERMISSIONS.SESSION_CREATE,
  CONFIGURATOR_3D_PERMISSIONS.SESSION_READ,
];

const EDITOR_PERMISSIONS: Configurator3DPermission[] = [
  ...VIEWER_PERMISSIONS,
  CONFIGURATOR_3D_PERMISSIONS.CONFIGURATION_CREATE,
  CONFIGURATOR_3D_PERMISSIONS.CONFIGURATION_UPDATE,
  CONFIGURATOR_3D_PERMISSIONS.CONFIGURATION_CLONE,
  CONFIGURATOR_3D_PERMISSIONS.COMPONENT_CREATE,
  CONFIGURATOR_3D_PERMISSIONS.COMPONENT_UPDATE,
  CONFIGURATOR_3D_PERMISSIONS.COMPONENT_REORDER,
  CONFIGURATOR_3D_PERMISSIONS.OPTION_CREATE,
  CONFIGURATOR_3D_PERMISSIONS.OPTION_UPDATE,
  CONFIGURATOR_3D_PERMISSIONS.OPTION_BULK_CREATE,
  CONFIGURATOR_3D_PERMISSIONS.RULE_CREATE,
  CONFIGURATOR_3D_PERMISSIONS.RULE_UPDATE,
  CONFIGURATOR_3D_PERMISSIONS.PRICING_UPDATE,
];

const MANAGER_PERMISSIONS: Configurator3DPermission[] = [
  ...EDITOR_PERMISSIONS,
  CONFIGURATOR_3D_PERMISSIONS.CONFIGURATION_DELETE,
  CONFIGURATOR_3D_PERMISSIONS.CONFIGURATION_PUBLISH,
  CONFIGURATOR_3D_PERMISSIONS.COMPONENT_DELETE,
  CONFIGURATOR_3D_PERMISSIONS.OPTION_DELETE,
  CONFIGURATOR_3D_PERMISSIONS.RULE_DELETE,
  CONFIGURATOR_3D_PERMISSIONS.SESSION_READ_ALL,
  CONFIGURATOR_3D_PERMISSIONS.SESSION_DELETE,
  CONFIGURATOR_3D_PERMISSIONS.EXPORT_PDF,
  CONFIGURATOR_3D_PERMISSIONS.EXPORT_AR,
  CONFIGURATOR_3D_PERMISSIONS.EXPORT_3D,
  CONFIGURATOR_3D_PERMISSIONS.ANALYTICS_READ,
  CONFIGURATOR_3D_PERMISSIONS.ANALYTICS_EXPORT,
];

const ALL_PERMISSIONS: Configurator3DPermission[] = [
  ...Object.values(CONFIGURATOR_3D_PERMISSIONS),
];

export const CONFIGURATOR_3D_ROLES = {
  VIEWER: VIEWER_PERMISSIONS,
  EDITOR: EDITOR_PERMISSIONS,
  MANAGER: MANAGER_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS,
} as const;

export type Configurator3DRole = keyof typeof CONFIGURATOR_3D_ROLES;

// =============================================================================
// RATE LIMITS (per endpoint, requests per minute)
// =============================================================================

export const CONFIGURATOR_3D_RATE_LIMITS = {
  PUBLIC_SESSION_CREATE: 10,
  PUBLIC_CONFIGURATION_READ: 100,
  PUBLIC_PRICE_CALCULATE: 50,
  CONFIGURATION_CREATE: 10,
  CONFIGURATION_UPDATE: 30,
  COMPONENT_CREATE: 50,
  OPTION_CREATE: 100,
  EXPORT: 5,
  BULK_OPERATIONS: 3,
} as const;

export type Configurator3DRateLimitKey =
  keyof typeof CONFIGURATOR_3D_RATE_LIMITS;

// =============================================================================
// VALIDATION LIMITS
// =============================================================================

export const CONFIGURATOR_3D_LIMITS = {
  MAX_COMPONENTS_PER_CONFIG: 50,
  MAX_OPTIONS_PER_COMPONENT: 100,
  MAX_RULES_PER_CONFIG: 200,
  MAX_TEXTURES_SIZE_MB: 10,
  MAX_MODEL_SIZE_MB: 50,
  MAX_SESSION_DURATION_HOURS: 24,
  MAX_SAVED_CONFIGS_PER_USER: 100,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_SKU_LENGTH: 50,
  MAX_TAGS: 20,
  MAX_CUSTOM_CSS: 5000,
  MAX_CONDITIONS_PER_RULE: 10,
  MAX_ACTIONS_PER_RULE: 10,
  MAX_DEPENDENCIES: 20,
  MAX_BULK_COMPONENTS: 50,
  MAX_BULK_OPTIONS: 50,
  MAX_REORDER_ITEMS: 50,
  MIN_NAME_LENGTH: 2,
  MAX_QUERY_LIMIT: 100,
} as const;

export type Configurator3DLimitKey = keyof typeof CONFIGURATOR_3D_LIMITS;
