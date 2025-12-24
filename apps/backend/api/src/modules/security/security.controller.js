"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rbac_interface_1 = require("./interfaces/rbac.interface");
const permissions_guard_1 = require("./guards/permissions.guard");
const require_permissions_decorator_1 = require("./decorators/require-permissions.decorator");
/**
 * Controller pour la sécurité et conformité
 */
let SecurityController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Security & Compliance'), (0, common_1.Controller)('security'), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getRoles_decorators;
    let _getRolePermissions_decorators;
    let _assignRole_decorators;
    let _getUserPermissions_decorators;
    let _getRoleStats_decorators;
    let _searchAuditLogs_decorators;
    let _getResourceHistory_decorators;
    let _getUserActivity_decorators;
    let _getAuditStats_decorators;
    let _exportAuditLogsCSV_decorators;
    let _detectSuspiciousActivity_decorators;
    let _exportUserData_decorators;
    let _deleteUserData_decorators;
    let _anonymizeUserData_decorators;
    let _recordConsent_decorators;
    let _getConsentHistory_decorators;
    let _getComplianceReport_decorators;
    let _scheduleDataRetention_decorators;
    var SecurityController = _classThis = class {
        constructor(rbacService, auditLogs, gdprService) {
            this.rbacService = (__runInitializers(this, _instanceExtraInitializers), rbacService);
            this.auditLogs = auditLogs;
            this.gdprService = gdprService;
        }
        // ==================== RBAC ====================
        async getRoles() {
            return {
                roles: Object.values(rbac_interface_1.Role),
                permissions: Object.values(rbac_interface_1.Permission),
            };
        }
        async getRolePermissions(role) {
            return {
                role,
                permissions: this.rbacService.getRolePermissions(role),
            };
        }
        async assignRole(userId, body) {
            await this.rbacService.assignRole(userId, body.role);
            return { success: true, userId, role: body.role };
        }
        async getUserPermissions(userId) {
            const [role, permissions] = await Promise.all([
                this.rbacService.getUserRole(userId),
                this.rbacService.getUserPermissions(userId),
            ]);
            return { userId, role, permissions };
        }
        async getRoleStats(brandId) {
            return this.rbacService.getRoleStats(brandId);
        }
        // ==================== AUDIT LOGS ====================
        async searchAuditLogs(userId, brandId, eventType, startDate, endDate, limit, offset) {
            return this.auditLogs.search({
                userId,
                brandId,
                eventType,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                limit: limit ? parseInt(limit, 10) : 100,
                offset: offset ? parseInt(offset, 10) : 0,
            });
        }
        async getResourceHistory(resourceType, resourceId) {
            const history = await this.auditLogs.getResourceHistory(resourceType, resourceId);
            return { resourceType, resourceId, history };
        }
        async getUserActivity(userId, limit) {
            const activity = await this.auditLogs.getUserActivity(userId, limit ? parseInt(limit, 10) : 100);
            return { userId, activity };
        }
        async getAuditStats(brandId, days) {
            return this.auditLogs.getStats(brandId, days ? parseInt(days, 10) : 30);
        }
        async exportAuditLogsCSV(filters) {
            const csv = await this.auditLogs.exportToCSV(filters);
            return {
                csv,
                filename: `audit-logs-${new Date().toISOString()}.csv`,
            };
        }
        async detectSuspiciousActivity(userId) {
            const alerts = await this.auditLogs.detectSuspiciousActivity(userId);
            return { userId, alerts };
        }
        // ==================== GDPR ====================
        async exportUserData(userId) {
            return this.gdprService.exportUserData(userId);
        }
        async deleteUserData(userId, body) {
            return this.gdprService.deleteUserData(userId, body.reason);
        }
        async anonymizeUserData(userId) {
            await this.gdprService.anonymizeUserData(userId);
            return { success: true, userId };
        }
        async recordConsent(body) {
            await this.gdprService.recordConsent(body.userId, body.consentType, body.given);
            return { success: true };
        }
        async getConsentHistory(userId) {
            const history = await this.gdprService.getConsentHistory(userId);
            return { userId, history };
        }
        async getComplianceReport(brandId) {
            return this.gdprService.generateComplianceReport(brandId);
        }
        async scheduleDataRetention(body) {
            return this.gdprService.scheduleDataRetention(body.days);
        }
    };
    __setFunctionName(_classThis, "SecurityController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getRoles_decorators = [(0, common_1.Get)('roles'), (0, swagger_1.ApiOperation)({ summary: 'List all available roles' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Roles listed' })];
        _getRolePermissions_decorators = [(0, common_1.Get)('roles/:role/permissions'), (0, swagger_1.ApiOperation)({ summary: 'Get permissions for a role' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Permissions retrieved' })];
        _assignRole_decorators = [(0, common_1.Post)('users/:userId/role'), (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard), (0, require_permissions_decorator_1.RequirePermissions)(rbac_interface_1.Permission.USER_UPDATE), (0, swagger_1.ApiOperation)({ summary: 'Assign a role to a user' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Role assigned' })];
        _getUserPermissions_decorators = [(0, common_1.Get)('users/:userId/permissions'), (0, swagger_1.ApiOperation)({ summary: 'Get all permissions for a user' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Permissions retrieved' })];
        _getRoleStats_decorators = [(0, common_1.Get)('roles/stats'), (0, swagger_1.ApiOperation)({ summary: 'Get role statistics' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Stats retrieved' })];
        _searchAuditLogs_decorators = [(0, common_1.Get)('audit/search'), (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard), (0, require_permissions_decorator_1.RequirePermissions)(rbac_interface_1.Permission.AUDIT_READ), (0, swagger_1.ApiOperation)({ summary: 'Search audit logs' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Audit logs retrieved' })];
        _getResourceHistory_decorators = [(0, common_1.Get)('audit/resource/:resourceType/:resourceId'), (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard), (0, require_permissions_decorator_1.RequirePermissions)(rbac_interface_1.Permission.AUDIT_READ), (0, swagger_1.ApiOperation)({ summary: 'Get audit history for a resource' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Resource history retrieved' })];
        _getUserActivity_decorators = [(0, common_1.Get)('audit/user/:userId'), (0, swagger_1.ApiOperation)({ summary: 'Get user activity log' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'User activity retrieved' })];
        _getAuditStats_decorators = [(0, common_1.Get)('audit/stats'), (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard), (0, require_permissions_decorator_1.RequirePermissions)(rbac_interface_1.Permission.AUDIT_READ), (0, swagger_1.ApiOperation)({ summary: 'Get audit statistics' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Stats retrieved' })];
        _exportAuditLogsCSV_decorators = [(0, common_1.Get)('audit/export/csv'), (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard), (0, require_permissions_decorator_1.RequirePermissions)(rbac_interface_1.Permission.AUDIT_EXPORT), (0, swagger_1.ApiOperation)({ summary: 'Export audit logs to CSV' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'CSV exported' })];
        _detectSuspiciousActivity_decorators = [(0, common_1.Get)('audit/suspicious/:userId'), (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard), (0, require_permissions_decorator_1.RequirePermissions)(rbac_interface_1.Permission.AUDIT_READ), (0, swagger_1.ApiOperation)({ summary: 'Detect suspicious activity' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Alerts retrieved' })];
        _exportUserData_decorators = [(0, common_1.Get)('gdpr/export/:userId'), (0, swagger_1.ApiOperation)({ summary: 'Export all user data (GDPR Right to Access)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'User data exported' })];
        _deleteUserData_decorators = [(0, common_1.Delete)('gdpr/delete/:userId'), (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard), (0, require_permissions_decorator_1.RequirePermissions)(rbac_interface_1.Permission.USER_DELETE), (0, swagger_1.ApiOperation)({ summary: 'Delete all user data (GDPR Right to Erasure)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'User data deleted' })];
        _anonymizeUserData_decorators = [(0, common_1.Post)('gdpr/anonymize/:userId'), (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard), (0, require_permissions_decorator_1.RequirePermissions)(rbac_interface_1.Permission.USER_UPDATE), (0, swagger_1.ApiOperation)({ summary: 'Anonymize user data' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'User data anonymized' })];
        _recordConsent_decorators = [(0, common_1.Post)('gdpr/consent'), (0, swagger_1.ApiOperation)({ summary: 'Record user consent' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Consent recorded' })];
        _getConsentHistory_decorators = [(0, common_1.Get)('gdpr/consent/:userId'), (0, swagger_1.ApiOperation)({ summary: 'Get consent history for a user' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Consent history retrieved' })];
        _getComplianceReport_decorators = [(0, common_1.Get)('gdpr/compliance/:brandId'), (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard), (0, require_permissions_decorator_1.RequirePermissions)(rbac_interface_1.Permission.AUDIT_READ), (0, swagger_1.ApiOperation)({ summary: 'Generate GDPR compliance report' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Compliance report generated' })];
        _scheduleDataRetention_decorators = [(0, common_1.Post)('gdpr/retention/schedule'), (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard), (0, require_permissions_decorator_1.RequirePermissions)(rbac_interface_1.Permission.SETTINGS_UPDATE), (0, swagger_1.ApiOperation)({ summary: 'Schedule data retention cleanup' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Retention scheduled' })];
        __esDecorate(_classThis, null, _getRoles_decorators, { kind: "method", name: "getRoles", static: false, private: false, access: { has: obj => "getRoles" in obj, get: obj => obj.getRoles }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRolePermissions_decorators, { kind: "method", name: "getRolePermissions", static: false, private: false, access: { has: obj => "getRolePermissions" in obj, get: obj => obj.getRolePermissions }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _assignRole_decorators, { kind: "method", name: "assignRole", static: false, private: false, access: { has: obj => "assignRole" in obj, get: obj => obj.assignRole }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUserPermissions_decorators, { kind: "method", name: "getUserPermissions", static: false, private: false, access: { has: obj => "getUserPermissions" in obj, get: obj => obj.getUserPermissions }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRoleStats_decorators, { kind: "method", name: "getRoleStats", static: false, private: false, access: { has: obj => "getRoleStats" in obj, get: obj => obj.getRoleStats }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _searchAuditLogs_decorators, { kind: "method", name: "searchAuditLogs", static: false, private: false, access: { has: obj => "searchAuditLogs" in obj, get: obj => obj.searchAuditLogs }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getResourceHistory_decorators, { kind: "method", name: "getResourceHistory", static: false, private: false, access: { has: obj => "getResourceHistory" in obj, get: obj => obj.getResourceHistory }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUserActivity_decorators, { kind: "method", name: "getUserActivity", static: false, private: false, access: { has: obj => "getUserActivity" in obj, get: obj => obj.getUserActivity }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAuditStats_decorators, { kind: "method", name: "getAuditStats", static: false, private: false, access: { has: obj => "getAuditStats" in obj, get: obj => obj.getAuditStats }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _exportAuditLogsCSV_decorators, { kind: "method", name: "exportAuditLogsCSV", static: false, private: false, access: { has: obj => "exportAuditLogsCSV" in obj, get: obj => obj.exportAuditLogsCSV }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _detectSuspiciousActivity_decorators, { kind: "method", name: "detectSuspiciousActivity", static: false, private: false, access: { has: obj => "detectSuspiciousActivity" in obj, get: obj => obj.detectSuspiciousActivity }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _exportUserData_decorators, { kind: "method", name: "exportUserData", static: false, private: false, access: { has: obj => "exportUserData" in obj, get: obj => obj.exportUserData }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteUserData_decorators, { kind: "method", name: "deleteUserData", static: false, private: false, access: { has: obj => "deleteUserData" in obj, get: obj => obj.deleteUserData }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _anonymizeUserData_decorators, { kind: "method", name: "anonymizeUserData", static: false, private: false, access: { has: obj => "anonymizeUserData" in obj, get: obj => obj.anonymizeUserData }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _recordConsent_decorators, { kind: "method", name: "recordConsent", static: false, private: false, access: { has: obj => "recordConsent" in obj, get: obj => obj.recordConsent }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getConsentHistory_decorators, { kind: "method", name: "getConsentHistory", static: false, private: false, access: { has: obj => "getConsentHistory" in obj, get: obj => obj.getConsentHistory }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getComplianceReport_decorators, { kind: "method", name: "getComplianceReport", static: false, private: false, access: { has: obj => "getComplianceReport" in obj, get: obj => obj.getComplianceReport }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _scheduleDataRetention_decorators, { kind: "method", name: "scheduleDataRetention", static: false, private: false, access: { has: obj => "scheduleDataRetention" in obj, get: obj => obj.scheduleDataRetention }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SecurityController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SecurityController = _classThis;
})();
exports.SecurityController = SecurityController;
