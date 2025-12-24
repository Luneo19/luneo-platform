"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogsService = exports.AuditEventType = void 0;
const common_1 = require("@nestjs/common");
/**
 * Types d'événements auditables
 */
var AuditEventType;
(function (AuditEventType) {
    // Authentication
    AuditEventType["LOGIN"] = "auth.login";
    AuditEventType["LOGOUT"] = "auth.logout";
    AuditEventType["LOGIN_FAILED"] = "auth.login_failed";
    AuditEventType["PASSWORD_CHANGED"] = "auth.password_changed";
    AuditEventType["PASSWORD_RESET"] = "auth.password_reset";
    // User Management
    AuditEventType["USER_CREATED"] = "user.created";
    AuditEventType["USER_UPDATED"] = "user.updated";
    AuditEventType["USER_DELETED"] = "user.deleted";
    AuditEventType["USER_ROLE_CHANGED"] = "user.role_changed";
    AuditEventType["USER_INVITED"] = "user.invited";
    // Brand Management
    AuditEventType["BRAND_CREATED"] = "brand.created";
    AuditEventType["BRAND_UPDATED"] = "brand.updated";
    AuditEventType["BRAND_DELETED"] = "brand.deleted";
    // Product Management
    AuditEventType["PRODUCT_CREATED"] = "product.created";
    AuditEventType["PRODUCT_UPDATED"] = "product.updated";
    AuditEventType["PRODUCT_DELETED"] = "product.deleted";
    AuditEventType["PRODUCT_PUBLISHED"] = "product.published";
    // Design Management
    AuditEventType["DESIGN_CREATED"] = "design.created";
    AuditEventType["DESIGN_UPDATED"] = "design.updated";
    AuditEventType["DESIGN_DELETED"] = "design.deleted";
    AuditEventType["DESIGN_APPROVED"] = "design.approved";
    // Order Management
    AuditEventType["ORDER_CREATED"] = "order.created";
    AuditEventType["ORDER_UPDATED"] = "order.updated";
    AuditEventType["ORDER_CANCELLED"] = "order.cancelled";
    AuditEventType["ORDER_REFUNDED"] = "order.refunded";
    // Billing
    AuditEventType["BILLING_UPDATED"] = "billing.updated";
    AuditEventType["INVOICE_GENERATED"] = "billing.invoice_generated";
    AuditEventType["PAYMENT_SUCCEEDED"] = "billing.payment_succeeded";
    AuditEventType["PAYMENT_FAILED"] = "billing.payment_failed";
    // Settings
    AuditEventType["SETTINGS_UPDATED"] = "settings.updated";
    // Integrations
    AuditEventType["INTEGRATION_CREATED"] = "integration.created";
    AuditEventType["INTEGRATION_UPDATED"] = "integration.updated";
    AuditEventType["INTEGRATION_DELETED"] = "integration.deleted";
    AuditEventType["INTEGRATION_SYNCED"] = "integration.synced";
    // API & Security
    AuditEventType["API_KEY_CREATED"] = "api.key_created";
    AuditEventType["API_KEY_DELETED"] = "api.key_deleted";
    AuditEventType["WEBHOOK_CREATED"] = "webhook.created";
    AuditEventType["WEBHOOK_DELETED"] = "webhook.deleted";
    AuditEventType["ACCESS_DENIED"] = "security.access_denied";
    AuditEventType["RATE_LIMIT_EXCEEDED"] = "security.rate_limit_exceeded";
    // GDPR
    AuditEventType["DATA_EXPORTED"] = "gdpr.data_exported";
    AuditEventType["DATA_DELETED"] = "gdpr.data_deleted";
    AuditEventType["CONSENT_GIVEN"] = "gdpr.consent_given";
    AuditEventType["CONSENT_WITHDRAWN"] = "gdpr.consent_withdrawn";
})(AuditEventType || (exports.AuditEventType = AuditEventType = {}));
/**
 * Service de gestion des logs d'audit
 * Traçabilité complète et immuable de toutes les actions
 */
let AuditLogsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AuditLogsService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
            this.logger = new common_1.Logger(AuditLogsService.name);
        }
        /**
         * Créer un log d'audit
         */
        async log(log) {
            try {
                // @ts-ignore - auditLog exists in schema but Prisma client may need regeneration
                await this.prisma.auditLog.create({
                    data: {
                        eventType: log.eventType,
                        userId: log.userId,
                        // userEmail: log.userEmail, // Commenté car pas dans AuditLogCreateInput
                        // brandId: log.brandId, // Commenté car pas dans AuditLogCreateInput
                        resourceType: log.resourceType,
                        resourceId: log.resourceId,
                        action: log.action,
                        metadata: log.metadata || {},
                        ipAddress: log.ipAddress,
                        userAgent: log.userAgent,
                        success: log.success,
                        // errorMessage: log.errorMessage, // Commenté car pas dans AuditLogCreateInput
                        timestamp: log.timestamp || new Date(),
                    },
                });
                // Log aussi dans les logs applicatifs pour debugging
                const logLevel = log.success ? 'log' : 'warn';
                this.logger[logLevel](`Audit: ${log.eventType} by ${log.userEmail || log.userId} - ${log.action}`);
            }
            catch (error) {
                // CRITICAL: Ne jamais faire échouer l'opération métier si l'audit échoue
                this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
            }
        }
        /**
         * Logger une action réussie
         */
        async logSuccess(eventType, action, context) {
            await this.log({
                eventType,
                action,
                success: true,
                timestamp: new Date(),
                ...context,
            });
        }
        /**
         * Logger une action échouée
         */
        async logFailure(eventType, action, error, context) {
            await this.log({
                eventType,
                action,
                success: false,
                errorMessage: error,
                timestamp: new Date(),
                ...context,
            });
        }
        /**
         * Rechercher des logs d'audit
         */
        async search(filters) {
            try {
                const where = {};
                if (filters.userId)
                    where.userId = filters.userId;
                if (filters.brandId)
                    where.brandId = filters.brandId;
                if (filters.eventType)
                    where.eventType = filters.eventType;
                if (filters.resourceType)
                    where.resourceType = filters.resourceType;
                if (filters.resourceId)
                    where.resourceId = filters.resourceId;
                if (filters.success !== undefined)
                    where.success = filters.success;
                if (filters.startDate || filters.endDate) {
                    where.timestamp = {};
                    if (filters.startDate)
                        where.timestamp.gte = filters.startDate;
                    if (filters.endDate)
                        where.timestamp.lte = filters.endDate;
                }
                const [logs, total] = await Promise.all([
                    this.prisma.auditLog.findMany({
                        where,
                        orderBy: { timestamp: 'desc' },
                        take: filters.limit || 100,
                        skip: filters.offset || 0,
                    }),
                    this.prisma.auditLog.count({ where }),
                ]);
                return { logs, total };
            }
            catch (error) {
                this.logger.error(`Failed to search audit logs: ${error.message}`, error.stack);
                return { logs: [], total: 0 };
            }
        }
        /**
         * Récupérer l'historique d'une ressource
         */
        async getResourceHistory(resourceType, resourceId) {
            try {
                // @ts-ignore - auditLog exists in schema but Prisma client may need regeneration
                return await this.prisma.auditLog.findMany({
                    where: {
                        resourceType,
                        resourceId,
                    },
                    orderBy: { timestamp: 'desc' },
                });
            }
            catch (error) {
                this.logger.error(`Failed to get resource history: ${error.message}`, error.stack);
                return [];
            }
        }
        /**
         * Récupérer l'activité d'un utilisateur
         */
        async getUserActivity(userId, limit = 100) {
            try {
                // @ts-ignore - auditLog exists in schema but Prisma client may need regeneration
                return await this.prisma.auditLog.findMany({
                    where: { userId },
                    orderBy: { timestamp: 'desc' },
                    take: limit,
                });
            }
            catch (error) {
                this.logger.error(`Failed to get user activity: ${error.message}`, error.stack);
                return [];
            }
        }
        /**
         * Statistiques d'audit
         */
        async getStats(brandId, days = 30) {
            try {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - days);
                const where = {
                    timestamp: { gte: startDate },
                };
                if (brandId)
                    where.brandId = brandId;
                const [total, success, failures, byEventType] = await Promise.all([
                    // @ts-ignore - auditLog exists in schema but Prisma client may need regeneration
                    this.prisma.auditLog.count({ where }),
                    // @ts-ignore - auditLog exists in schema but Prisma client may need regeneration
                    this.prisma.auditLog.count({ where: { ...where, success: true } }),
                    // @ts-ignore - auditLog exists in schema but Prisma client may need regeneration
                    this.prisma.auditLog.count({ where: { ...where, success: false } }),
                    // @ts-ignore - auditLog exists in schema but Prisma client may need regeneration
                    this.prisma.auditLog.groupBy({
                        by: ['eventType'],
                        where,
                        _count: true,
                        orderBy: { _count: { eventType: 'desc' } },
                        take: 10,
                    }),
                ]);
                return {
                    period: { days, startDate, endDate: new Date() },
                    total,
                    success,
                    failures,
                    successRate: total > 0 ? (success / total) * 100 : 0,
                    topEvents: byEventType.map((e) => ({
                        eventType: e.eventType,
                        count: e._count,
                    })),
                };
            }
            catch (error) {
                this.logger.error(`Failed to get audit stats: ${error.message}`, error.stack);
                return null;
            }
        }
        /**
         * Exporter des logs en CSV
         */
        async exportToCSV(filters) {
            try {
                const { logs } = await this.search({ ...filters, limit: 10000 });
                let csv = 'Timestamp,Event Type,User,Brand,Action,Resource,Success,IP,Error\n';
                for (const log of logs) {
                    const timestamp = log.timestamp.toISOString();
                    const eventType = log.eventType;
                    const user = log.userEmail || log.userId || 'N/A';
                    const brand = log.brandId || 'N/A';
                    const action = log.action;
                    const resource = log.resourceId
                        ? `${log.resourceType}:${log.resourceId}`
                        : 'N/A';
                    const success = log.success ? 'Yes' : 'No';
                    const ip = log.ipAddress || 'N/A';
                    const error = log.errorMessage || '';
                    csv += `${timestamp},${eventType},${user},${brand},${action},${resource},${success},${ip},"${error}"\n`;
                }
                return csv;
            }
            catch (error) {
                this.logger.error(`Failed to export CSV: ${error.message}`, error.stack);
                throw error;
            }
        }
        /**
         * Détecter des activités suspectes
         */
        async detectSuspiciousActivity(userId) {
            try {
                const oneHourAgo = new Date();
                oneHourAgo.setHours(oneHourAgo.getHours() - 1);
                // Rechercher les échecs multiples
                // @ts-ignore - auditLog exists in schema but Prisma client may need regeneration
                const recentFailures = await this.prisma.auditLog.findMany({
                    where: {
                        userId,
                        success: false,
                        timestamp: { gte: oneHourAgo },
                    },
                    orderBy: { timestamp: 'desc' },
                });
                const alerts = [];
                // Alerte si > 5 échecs en 1h
                if (recentFailures.length > 5) {
                    alerts.push({
                        type: 'multiple_failures',
                        severity: 'high',
                        message: `${recentFailures.length} failed actions in the last hour`,
                        count: recentFailures.length,
                    });
                }
                // Alerte si accès refusés répétés
                const accessDenied = recentFailures.filter((f) => f.eventType === AuditEventType.ACCESS_DENIED);
                if (accessDenied.length > 3) {
                    alerts.push({
                        type: 'repeated_access_denied',
                        severity: 'medium',
                        message: `${accessDenied.length} access denied events`,
                        count: accessDenied.length,
                    });
                }
                return alerts;
            }
            catch (error) {
                this.logger.error(`Failed to detect suspicious activity: ${error.message}`, error.stack);
                return [];
            }
        }
    };
    __setFunctionName(_classThis, "AuditLogsService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuditLogsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuditLogsService = _classThis;
})();
exports.AuditLogsService = AuditLogsService;
