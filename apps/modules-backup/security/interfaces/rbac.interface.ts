/**
 * Définition des rôles disponibles dans le système
 */
export enum Role {
  SUPER_ADMIN = 'super_admin', // Accès total
  ADMIN = 'admin', // Administration complète d'une marque
  MANAGER = 'manager', // Gestion opérationnelle
  DESIGNER = 'designer', // Création de designs
  VIEWER = 'viewer', // Lecture seule
}

/**
 * Permissions granulaires par ressource
 */
export enum Permission {
  // Brand Management
  BRAND_CREATE = 'brand:create',
  BRAND_READ = 'brand:read',
  BRAND_UPDATE = 'brand:update',
  BRAND_DELETE = 'brand:delete',

  // Product Management
  PRODUCT_CREATE = 'product:create',
  PRODUCT_READ = 'product:read',
  PRODUCT_UPDATE = 'product:update',
  PRODUCT_DELETE = 'product:delete',
  PRODUCT_PUBLISH = 'product:publish',

  // Design Management
  DESIGN_CREATE = 'design:create',
  DESIGN_READ = 'design:read',
  DESIGN_UPDATE = 'design:update',
  DESIGN_DELETE = 'design:delete',
  DESIGN_APPROVE = 'design:approve',

  // Order Management
  ORDER_CREATE = 'order:create',
  ORDER_READ = 'order:read',
  ORDER_UPDATE = 'order:update',
  ORDER_CANCEL = 'order:cancel',
  ORDER_REFUND = 'order:refund',

  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_INVITE = 'user:invite',

  // Billing Management
  BILLING_READ = 'billing:read',
  BILLING_UPDATE = 'billing:update',
  BILLING_EXPORT = 'billing:export',

  // Analytics
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_EXPORT = 'analytics:export',

  // Settings
  SETTINGS_READ = 'settings:read',
  SETTINGS_UPDATE = 'settings:update',

  // Integrations
  INTEGRATION_CREATE = 'integration:create',
  INTEGRATION_READ = 'integration:read',
  INTEGRATION_UPDATE = 'integration:update',
  INTEGRATION_DELETE = 'integration:delete',

  // API & Webhooks
  API_KEY_CREATE = 'api_key:create',
  API_KEY_READ = 'api_key:read',
  API_KEY_DELETE = 'api_key:delete',
  WEBHOOK_CREATE = 'webhook:create',
  WEBHOOK_READ = 'webhook:read',
  WEBHOOK_DELETE = 'webhook:delete',

  // Audit & Security
  AUDIT_READ = 'audit:read',
  AUDIT_EXPORT = 'audit:export',
}

/**
 * Mapping des rôles vers les permissions
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission), // Toutes les permissions

  [Role.ADMIN]: [
    // Brand
    Permission.BRAND_READ,
    Permission.BRAND_UPDATE,

    // Product
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_READ,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
    Permission.PRODUCT_PUBLISH,

    // Design
    Permission.DESIGN_CREATE,
    Permission.DESIGN_READ,
    Permission.DESIGN_UPDATE,
    Permission.DESIGN_DELETE,
    Permission.DESIGN_APPROVE,

    // Order
    Permission.ORDER_CREATE,
    Permission.ORDER_READ,
    Permission.ORDER_UPDATE,
    Permission.ORDER_CANCEL,
    Permission.ORDER_REFUND,

    // User
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_INVITE,

    // Billing
    Permission.BILLING_READ,
    Permission.BILLING_UPDATE,
    Permission.BILLING_EXPORT,

    // Analytics
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_EXPORT,

    // Settings
    Permission.SETTINGS_READ,
    Permission.SETTINGS_UPDATE,

    // Integrations
    Permission.INTEGRATION_CREATE,
    Permission.INTEGRATION_READ,
    Permission.INTEGRATION_UPDATE,
    Permission.INTEGRATION_DELETE,

    // API & Webhooks
    Permission.API_KEY_CREATE,
    Permission.API_KEY_READ,
    Permission.API_KEY_DELETE,
    Permission.WEBHOOK_CREATE,
    Permission.WEBHOOK_READ,
    Permission.WEBHOOK_DELETE,

    // Audit
    Permission.AUDIT_READ,
    Permission.AUDIT_EXPORT,
  ],

  [Role.MANAGER]: [
    // Product
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_READ,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_PUBLISH,

    // Design
    Permission.DESIGN_CREATE,
    Permission.DESIGN_READ,
    Permission.DESIGN_UPDATE,
    Permission.DESIGN_APPROVE,

    // Order
    Permission.ORDER_CREATE,
    Permission.ORDER_READ,
    Permission.ORDER_UPDATE,
    Permission.ORDER_CANCEL,

    // User
    Permission.USER_READ,
    Permission.USER_INVITE,

    // Billing
    Permission.BILLING_READ,

    // Analytics
    Permission.ANALYTICS_READ,

    // Settings
    Permission.SETTINGS_READ,

    // Integrations
    Permission.INTEGRATION_READ,
  ],

  [Role.DESIGNER]: [
    // Product
    Permission.PRODUCT_READ,

    // Design
    Permission.DESIGN_CREATE,
    Permission.DESIGN_READ,
    Permission.DESIGN_UPDATE,

    // Order
    Permission.ORDER_READ,

    // Analytics
    Permission.ANALYTICS_READ,
  ],

  [Role.VIEWER]: [
    // Product
    Permission.PRODUCT_READ,

    // Design
    Permission.DESIGN_READ,

    // Order
    Permission.ORDER_READ,

    // Analytics
    Permission.ANALYTICS_READ,
  ],
};

/**
 * Interface pour les infos utilisateur dans la requête
 */
export interface RequestUser {
  id: string;
  email: string;
  role: Role;
  brandId?: string;
  permissions: Permission[];
}

/**
 * Interface pour le contexte d'autorisation
 */
export interface AuthorizationContext {
  user: RequestUser;
  resource?: any;
  action: Permission;
}

/**
 * Interface pour les règles d'accès personnalisées
 */
export interface AccessRule {
  resource: string;
  condition: (context: AuthorizationContext) => boolean;
}

