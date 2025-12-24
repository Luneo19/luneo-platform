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
exports.ObservabilityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@/modules/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("@/common/guards/roles.guard");
let ObservabilityController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Observability'), (0, common_1.Controller)('observability'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _evaluateSLOs_decorators;
    let _getSLOHistory_decorators;
    let _getTrace_decorators;
    let _getServiceTraces_decorators;
    let _getCostDashboard_decorators;
    let _getTenantCost_decorators;
    let _createDatabaseBackup_decorators;
    let _restoreBackup_decorators;
    let _listBackups_decorators;
    let _verifyBackup_decorators;
    let _runRestoreDrill_decorators;
    let _generateDRReport_decorators;
    var ObservabilityController = _classThis = class {
        constructor(sloService, tracingService, costDashboard, drService) {
            this.sloService = (__runInitializers(this, _instanceExtraInitializers), sloService);
            this.tracingService = tracingService;
            this.costDashboard = costDashboard;
            this.drService = drService;
        }
        // ========================================
        // SLO/SLI
        // ========================================
        async evaluateSLOs() {
            const results = await this.sloService.evaluateAllSLOs();
            await this.sloService.saveSLOResults(results);
            return results;
        }
        async getSLOHistory(service, metric, days = 7) {
            return this.sloService.getSLOHistory(service, metric, days);
        }
        // ========================================
        // TRACING
        // ========================================
        async getTrace(traceId) {
            return this.tracingService.getTrace(traceId);
        }
        async getServiceTraces(service, limit = 100) {
            return this.tracingService.getServiceTraces(service, limit);
        }
        // ========================================
        // COST DASHBOARD
        // ========================================
        async getCostDashboard(dto) {
            return this.costDashboard.getCostDashboard(dto.period || 'month', dto.startDate ? new Date(dto.startDate) : undefined, dto.endDate ? new Date(dto.endDate) : undefined);
        }
        async getTenantCost(brandId, dto) {
            return this.costDashboard.getTenantCost(brandId, dto.period || 'month');
        }
        // ========================================
        // DISASTER RECOVERY
        // ========================================
        async createDatabaseBackup() {
            return this.drService.createDatabaseBackup();
        }
        async restoreBackup(backupId) {
            return this.drService.restoreDatabaseBackup(backupId);
        }
        async listBackups(type, limit = 50) {
            return this.drService.listBackups(type, limit);
        }
        async verifyBackup(backupId) {
            return this.drService.verifyBackup(backupId);
        }
        async runRestoreDrill(backupId) {
            return this.drService.runRestoreDrill(backupId);
        }
        async generateDRReport() {
            return this.drService.generateDRReport();
        }
    };
    __setFunctionName(_classThis, "ObservabilityController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _evaluateSLOs_decorators = [(0, common_1.Get)('slo'), (0, roles_guard_1.Roles)('PLATFORM_ADMIN'), (0, swagger_1.ApiOperation)({ summary: 'Évalue tous les SLO' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'SLO évalués' })];
        _getSLOHistory_decorators = [(0, common_1.Get)('slo/:service/:metric'), (0, roles_guard_1.Roles)('PLATFORM_ADMIN'), (0, swagger_1.ApiOperation)({ summary: 'Récupère l\'historique SLO' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Historique récupéré' })];
        _getTrace_decorators = [(0, common_1.Get)('traces/:traceId'), (0, roles_guard_1.Roles)('PLATFORM_ADMIN'), (0, swagger_1.ApiOperation)({ summary: 'Récupère une trace complète' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Trace récupérée' })];
        _getServiceTraces_decorators = [(0, common_1.Get)('traces/service/:service'), (0, roles_guard_1.Roles)('PLATFORM_ADMIN'), (0, swagger_1.ApiOperation)({ summary: 'Récupère les traces d\'un service' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Traces récupérées' })];
        _getCostDashboard_decorators = [(0, common_1.Get)('costs'), (0, roles_guard_1.Roles)('PLATFORM_ADMIN'), (0, swagger_1.ApiOperation)({ summary: 'Récupère le dashboard de coûts global' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard récupéré' })];
        _getTenantCost_decorators = [(0, common_1.Get)('costs/tenant/:brandId'), (0, swagger_1.ApiOperation)({ summary: 'Récupère le coût d\'un tenant' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Coût récupéré' })];
        _createDatabaseBackup_decorators = [(0, common_1.Post)('backups/database'), (0, roles_guard_1.Roles)('PLATFORM_ADMIN'), (0, swagger_1.ApiOperation)({ summary: 'Crée un backup de la base de données' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Backup créé' })];
        _restoreBackup_decorators = [(0, common_1.Post)('backups/:backupId/restore'), (0, roles_guard_1.Roles)('PLATFORM_ADMIN'), (0, swagger_1.ApiOperation)({ summary: 'Restaure un backup' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Backup restauré' })];
        _listBackups_decorators = [(0, common_1.Get)('backups'), (0, roles_guard_1.Roles)('PLATFORM_ADMIN'), (0, swagger_1.ApiOperation)({ summary: 'Liste les backups disponibles' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Backups récupérés' })];
        _verifyBackup_decorators = [(0, common_1.Post)('backups/:backupId/verify'), (0, roles_guard_1.Roles)('PLATFORM_ADMIN'), (0, swagger_1.ApiOperation)({ summary: 'Vérifie l\'intégrité d\'un backup' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Backup vérifié' })];
        _runRestoreDrill_decorators = [(0, common_1.Post)('drills/:backupId'), (0, roles_guard_1.Roles)('PLATFORM_ADMIN'), (0, swagger_1.ApiOperation)({ summary: 'Exécute un drill de restauration' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Drill exécuté' })];
        _generateDRReport_decorators = [(0, common_1.Get)('dr/report'), (0, roles_guard_1.Roles)('PLATFORM_ADMIN'), (0, swagger_1.ApiOperation)({ summary: 'Génère un rapport DR' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Rapport généré' })];
        __esDecorate(_classThis, null, _evaluateSLOs_decorators, { kind: "method", name: "evaluateSLOs", static: false, private: false, access: { has: obj => "evaluateSLOs" in obj, get: obj => obj.evaluateSLOs }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSLOHistory_decorators, { kind: "method", name: "getSLOHistory", static: false, private: false, access: { has: obj => "getSLOHistory" in obj, get: obj => obj.getSLOHistory }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getTrace_decorators, { kind: "method", name: "getTrace", static: false, private: false, access: { has: obj => "getTrace" in obj, get: obj => obj.getTrace }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getServiceTraces_decorators, { kind: "method", name: "getServiceTraces", static: false, private: false, access: { has: obj => "getServiceTraces" in obj, get: obj => obj.getServiceTraces }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCostDashboard_decorators, { kind: "method", name: "getCostDashboard", static: false, private: false, access: { has: obj => "getCostDashboard" in obj, get: obj => obj.getCostDashboard }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getTenantCost_decorators, { kind: "method", name: "getTenantCost", static: false, private: false, access: { has: obj => "getTenantCost" in obj, get: obj => obj.getTenantCost }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createDatabaseBackup_decorators, { kind: "method", name: "createDatabaseBackup", static: false, private: false, access: { has: obj => "createDatabaseBackup" in obj, get: obj => obj.createDatabaseBackup }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _restoreBackup_decorators, { kind: "method", name: "restoreBackup", static: false, private: false, access: { has: obj => "restoreBackup" in obj, get: obj => obj.restoreBackup }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _listBackups_decorators, { kind: "method", name: "listBackups", static: false, private: false, access: { has: obj => "listBackups" in obj, get: obj => obj.listBackups }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _verifyBackup_decorators, { kind: "method", name: "verifyBackup", static: false, private: false, access: { has: obj => "verifyBackup" in obj, get: obj => obj.verifyBackup }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _runRestoreDrill_decorators, { kind: "method", name: "runRestoreDrill", static: false, private: false, access: { has: obj => "runRestoreDrill" in obj, get: obj => obj.runRestoreDrill }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateDRReport_decorators, { kind: "method", name: "generateDRReport", static: false, private: false, access: { has: obj => "generateDRReport" in obj, get: obj => obj.generateDRReport }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ObservabilityController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ObservabilityController = _classThis;
})();
exports.ObservabilityController = ObservabilityController;
