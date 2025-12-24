"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.Permission = exports.Role = void 0;
/**
 * Définition des rôles disponibles dans le système
 */
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "super_admin";
    Role["ADMIN"] = "admin";
    Role["MANAGER"] = "manager";
    Role["DESIGNER"] = "designer";
    Role["VIEWER"] = "viewer";
})(Role || (exports.Role = Role = {}));
/**
 * Permissions granulaires par ressource
 */
var Permission;
(function (Permission) {
    // Brand Management
    Permission["BRAND_CREATE"] = "brand:create";
    Permission["BRAND_READ"] = "brand:read";
    Permission["BRAND_UPDATE"] = "brand:update";
    Permission["BRAND_DELETE"] = "brand:delete";
    // Product Management
    Permission["PRODUCT_CREATE"] = "product:create";
    Permission["PRODUCT_READ"] = "product:read";
    Permission["PRODUCT_UPDATE"] = "product:update";
    Permission["PRODUCT_DELETE"] = "product:delete";
    Permission["PRODUCT_PUBLISH"] = "product:publish";
    // Design Management
    Permission["DESIGN_CREATE"] = "design:create";
    Permission["DESIGN_READ"] = "design:read";
    Permission["DESIGN_UPDATE"] = "design:update";
    Permission["DESIGN_DELETE"] = "design:delete";
    Permission["DESIGN_APPROVE"] = "design:approve";
    // Order Management
    Permission["ORDER_CREATE"] = "order:create";
    Permission["ORDER_READ"] = "order:read";
    Permission["ORDER_UPDATE"] = "order:update";
    Permission["ORDER_CANCEL"] = "order:cancel";
    Permission["ORDER_REFUND"] = "order:refund";
    // User Management
    Permission["USER_CREATE"] = "user:create";
    Permission["USER_READ"] = "user:read";
    Permission["USER_UPDATE"] = "user:update";
    Permission["USER_DELETE"] = "user:delete";
    Permission["USER_INVITE"] = "user:invite";
    // Billing Management
    Permission["BILLING_READ"] = "billing:read";
    Permission["BILLING_UPDATE"] = "billing:update";
    Permission["BILLING_EXPORT"] = "billing:export";
    // Analytics
    Permission["ANALYTICS_READ"] = "analytics:read";
    Permission["ANALYTICS_EXPORT"] = "analytics:export";
    // Settings
    Permission["SETTINGS_READ"] = "settings:read";
    Permission["SETTINGS_UPDATE"] = "settings:update";
    // Integrations
    Permission["INTEGRATION_CREATE"] = "integration:create";
    Permission["INTEGRATION_READ"] = "integration:read";
    Permission["INTEGRATION_UPDATE"] = "integration:update";
    Permission["INTEGRATION_DELETE"] = "integration:delete";
    // API & Webhooks
    Permission["API_KEY_CREATE"] = "api_key:create";
    Permission["API_KEY_READ"] = "api_key:read";
    Permission["API_KEY_DELETE"] = "api_key:delete";
    Permission["WEBHOOK_CREATE"] = "webhook:create";
    Permission["WEBHOOK_READ"] = "webhook:read";
    Permission["WEBHOOK_DELETE"] = "webhook:delete";
    // Audit & Security
    Permission["AUDIT_READ"] = "audit:read";
    Permission["AUDIT_EXPORT"] = "audit:export";
})(Permission || (exports.Permission = Permission = {}));
/**
 * Mapping des rôles vers les permissions
 */
exports.ROLE_PERMISSIONS = {
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
