const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', '..', '..', 'node_modules', '.prisma', 'client', 'index.js');

if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf-8');
  
  if (!content.includes('// V1 COMPAT ENUMS')) {
    const v1Enums = `
// V1 COMPAT ENUMS (added by patch-prisma-enums.js)
exports.UserRole = { PLATFORM_ADMIN: 'ADMIN', BRAND_ADMIN: 'ADMIN', BRAND_USER: 'USER', CONSUMER: 'USER', FABRICATOR: 'USER', USER: 'USER', ADMIN: 'ADMIN' };
exports.ChurnRisk = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', CRITICAL: 'CRITICAL' };
exports.SubscriptionPlan = { FREE: 'FREE', STARTER: 'STARTER', PRO: 'PRO', BUSINESS: 'BUSINESS', ENTERPRISE: 'ENTERPRISE' };
exports.SubscriptionStatus = { ACTIVE: 'ACTIVE', TRIALING: 'TRIALING', PAST_DUE: 'PAST_DUE', CANCELED: 'CANCELED', PAUSED: 'PAUSED' };
exports.TicketPriority = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', URGENT: 'URGENT' };
exports.TicketStatus = { OPEN: 'OPEN', IN_PROGRESS: 'IN_PROGRESS', WAITING: 'WAITING', RESOLVED: 'RESOLVED', CLOSED: 'CLOSED' };
exports.TicketCategory = { TECHNICAL: 'TECHNICAL', BILLING: 'BILLING', FEATURE: 'FEATURE', OTHER: 'OTHER' };
exports.TicketSource = { EMAIL: 'EMAIL', CHAT: 'CHAT', PHONE: 'PHONE', WEB: 'WEB' };
exports.PaymentStatus = { PENDING: 'PENDING', SUCCEEDED: 'SUCCEEDED', FAILED: 'FAILED', REFUNDED: 'REFUNDED' };
exports.ReferralStatus = { PENDING: 'PENDING', ACTIVE: 'ACTIVE', COMPLETED: 'COMPLETED', EXPIRED: 'EXPIRED' };
exports.GenerationStatus = { PENDING: 'PENDING', PROCESSING: 'PROCESSING', COMPLETED: 'COMPLETED', FAILED: 'FAILED' };
exports.AIGenerationStatus = { PENDING: 'PENDING', PROCESSING: 'PROCESSING', COMPLETED: 'COMPLETED', FAILED: 'FAILED' };
exports.AIGenerationType = { IMAGE: 'IMAGE', TEXT: 'TEXT', VIDEO: 'VIDEO', MODEL_3D: 'MODEL_3D' };
exports.AIResponseStatus = { SUCCESS: 'SUCCESS', ERROR: 'ERROR', RATE_LIMITED: 'RATE_LIMITED' };
exports.AlertSeverity = { INFO: 'INFO', WARNING: 'WARNING', ERROR: 'ERROR', CRITICAL: 'CRITICAL' };
exports.AlertStatus = { ACTIVE: 'ACTIVE', ACKNOWLEDGED: 'ACKNOWLEDGED', RESOLVED: 'RESOLVED' };
exports.AutomationStatus = { ACTIVE: 'ACTIVE', PAUSED: 'PAUSED', DRAFT: 'DRAFT' };
exports.AutomationRunStatus = { PENDING: 'PENDING', RUNNING: 'RUNNING', COMPLETED: 'COMPLETED', FAILED: 'FAILED' };
exports.EmailTemplateCategory = { WELCOME: 'WELCOME', PASSWORD_RESET: 'PASSWORD_RESET', NOTIFICATION: 'NOTIFICATION', MARKETING: 'MARKETING' };
exports.EscalationLevel = { L1: 'L1', L2: 'L2', L3: 'L3', MANAGER: 'MANAGER' };
exports.GrowthPotential = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' };
exports.OrionAgentStatus = { ACTIVE: 'ACTIVE', PAUSED: 'PAUSED', ERROR: 'ERROR' };
exports.OrionAgentType = { ZEUS: 'ZEUS', ATHENA: 'ATHENA', APOLLO: 'APOLLO', ARTEMIS: 'ARTEMIS', HERMES: 'HERMES', HADES: 'HADES', PROMETHEUS: 'PROMETHEUS' };
exports.ResourceType = { CPU: 'CPU', MEMORY: 'MEMORY', DISK: 'DISK', NETWORK: 'NETWORK' };
exports.ServiceHealthStatus = { HEALTHY: 'HEALTHY', DEGRADED: 'DEGRADED', DOWN: 'DOWN' };
exports.SyncDirection = { IMPORT: 'IMPORT', EXPORT: 'EXPORT', BIDIRECTIONAL: 'BIDIRECTIONAL' };
exports.SyncLogStatus = { SUCCESS: 'SUCCESS', FAILED: 'FAILED', PARTIAL: 'PARTIAL' };
exports.SyncLogType = { PRODUCTS: 'PRODUCTS', ORDERS: 'ORDERS', CUSTOMERS: 'CUSTOMERS' };
exports.VideoStatus = { PENDING: 'PENDING', PROCESSING: 'PROCESSING', COMPLETED: 'COMPLETED', FAILED: 'FAILED' };
exports.OrderStatus = { PENDING: 'PENDING', PAID: 'PAID', PROCESSING: 'PROCESSING', SHIPPED: 'SHIPPED', DELIVERED: 'DELIVERED', CANCELLED: 'CANCELLED', REFUNDED: 'REFUNDED' };
exports.DesignStatus = { DRAFT: 'DRAFT', PROCESSING: 'PROCESSING', COMPLETED: 'COMPLETED', FAILED: 'FAILED', PUBLISHED: 'PUBLISHED' };
exports.BrandStatus = { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', TRIAL: 'TRIAL' };
exports.ProductStatus = { DRAFT: 'DRAFT', ACTIVE: 'ACTIVE', ARCHIVED: 'ARCHIVED' };
`;
    
    content += v1Enums;
    fs.writeFileSync(indexPath, content);
    console.log('Patched @prisma/client with V1 enum compatibility layer');
  }
}
