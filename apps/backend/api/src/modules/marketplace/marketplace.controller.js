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
exports.MarketplaceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@/modules/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("@/common/guards/roles.guard");
let MarketplaceController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Marketplace'), (0, common_1.Controller)('marketplace'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createArtisan_decorators;
    let _submitKYCDocuments_decorators;
    let _verifyArtisan_decorators;
    let _addCapability_decorators;
    let _findBestArtisans_decorators;
    let _routeOrder_decorators;
    let _createPayout_decorators;
    let _evaluateSLA_decorators;
    let _applySLAToPayout_decorators;
    let _createQCReport_decorators;
    let _getArtisanQCStats_decorators;
    var MarketplaceController = _classThis = class {
        constructor(artisanOnboarding, orderRouting, stripeConnect, slaEnforcement, qcSystem) {
            this.artisanOnboarding = (__runInitializers(this, _instanceExtraInitializers), artisanOnboarding);
            this.orderRouting = orderRouting;
            this.stripeConnect = stripeConnect;
            this.slaEnforcement = slaEnforcement;
            this.qcSystem = qcSystem;
        }
        // ========================================
        // ARTISAN ONBOARDING
        // ========================================
        async createArtisan(dto) {
            return this.artisanOnboarding.createArtisan(dto);
        }
        async submitKYCDocuments(artisanId, dto) {
            return this.artisanOnboarding.submitKYCDocuments(artisanId, dto.documents.map(doc => ({ ...doc, verified: false })));
        }
        async verifyArtisan(artisanId, dto) {
            return this.artisanOnboarding.verifyArtisan(artisanId, dto.verified, dto.reason);
        }
        async addCapability(artisanId, dto) {
            return this.artisanOnboarding.addCapability(artisanId, dto.material, dto.technique, dto.options);
        }
        // ========================================
        // ORDER ROUTING
        // ========================================
        async findBestArtisans(orderId, dto, limit = 3) {
            return this.orderRouting.findBestArtisans({ ...dto, orderId }, limit);
        }
        async routeOrder(orderId, dto) {
            return this.orderRouting.routeOrder(orderId, dto.artisanId, {
                ...dto.quote,
                breakdown: dto.quote.breakdown || {},
            });
        }
        // ========================================
        // STRIPE CONNECT
        // ========================================
        async createPayout(dto) {
            return this.stripeConnect.createPayout(dto.artisanId, dto.workOrderIds);
        }
        // ========================================
        // SLA ENFORCEMENT
        // ========================================
        async evaluateSLA(workOrderId) {
            return this.slaEnforcement.evaluateSLA(workOrderId);
        }
        async applySLAToPayout(payoutId) {
            return this.slaEnforcement.applySLAToPayout(payoutId);
        }
        // ========================================
        // QC SYSTEM
        // ========================================
        async createQCReport(dto) {
            return this.qcSystem.createQCReport(dto);
        }
        async getArtisanQCStats(artisanId) {
            return this.qcSystem.getArtisanQCStats(artisanId);
        }
    };
    __setFunctionName(_classThis, "MarketplaceController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createArtisan_decorators = [(0, common_1.Post)('artisans'), (0, swagger_1.ApiOperation)({ summary: 'Crée un artisan et démarre l\'onboarding' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Artisan créé' })];
        _submitKYCDocuments_decorators = [(0, common_1.Post)('artisans/:artisanId/kyc'), (0, swagger_1.ApiOperation)({ summary: 'Soumet des documents KYC' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Documents soumis' })];
        _verifyArtisan_decorators = [(0, common_1.Put)('artisans/:artisanId/verify'), (0, roles_guard_1.Roles)('PLATFORM_ADMIN'), (0, swagger_1.ApiOperation)({ summary: 'Vérifie un artisan (admin)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Artisan vérifié' })];
        _addCapability_decorators = [(0, common_1.Post)('artisans/:artisanId/capabilities'), (0, swagger_1.ApiOperation)({ summary: 'Ajoute une capacité à un artisan' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Capacité ajoutée' })];
        _findBestArtisans_decorators = [(0, common_1.Post)('orders/:orderId/routing'), (0, swagger_1.ApiOperation)({ summary: 'Trouve les meilleurs artisans pour une commande' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Artisans trouvés' })];
        _routeOrder_decorators = [(0, common_1.Post)('orders/:orderId/route'), (0, swagger_1.ApiOperation)({ summary: 'Route une commande vers un artisan' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Commande routée' })];
        _createPayout_decorators = [(0, common_1.Post)('payouts'), (0, swagger_1.ApiOperation)({ summary: 'Crée un payout pour un artisan' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Payout créé' })];
        _evaluateSLA_decorators = [(0, common_1.Post)('sla/:workOrderId/evaluate'), (0, swagger_1.ApiOperation)({ summary: 'Évalue le SLA d\'un work order' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'SLA évalué' })];
        _applySLAToPayout_decorators = [(0, common_1.Post)('payouts/:payoutId/apply-sla'), (0, swagger_1.ApiOperation)({ summary: 'Applique les pénalités/bonus SLA au payout' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'SLA appliqué' })];
        _createQCReport_decorators = [(0, common_1.Post)('qc/reports'), (0, swagger_1.ApiOperation)({ summary: 'Crée un rapport QC' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Rapport QC créé' })];
        _getArtisanQCStats_decorators = [(0, common_1.Get)('artisans/:artisanId/qc-stats'), (0, swagger_1.ApiOperation)({ summary: 'Récupère les statistiques QC d\'un artisan' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistiques récupérées' })];
        __esDecorate(_classThis, null, _createArtisan_decorators, { kind: "method", name: "createArtisan", static: false, private: false, access: { has: obj => "createArtisan" in obj, get: obj => obj.createArtisan }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _submitKYCDocuments_decorators, { kind: "method", name: "submitKYCDocuments", static: false, private: false, access: { has: obj => "submitKYCDocuments" in obj, get: obj => obj.submitKYCDocuments }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _verifyArtisan_decorators, { kind: "method", name: "verifyArtisan", static: false, private: false, access: { has: obj => "verifyArtisan" in obj, get: obj => obj.verifyArtisan }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addCapability_decorators, { kind: "method", name: "addCapability", static: false, private: false, access: { has: obj => "addCapability" in obj, get: obj => obj.addCapability }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findBestArtisans_decorators, { kind: "method", name: "findBestArtisans", static: false, private: false, access: { has: obj => "findBestArtisans" in obj, get: obj => obj.findBestArtisans }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _routeOrder_decorators, { kind: "method", name: "routeOrder", static: false, private: false, access: { has: obj => "routeOrder" in obj, get: obj => obj.routeOrder }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createPayout_decorators, { kind: "method", name: "createPayout", static: false, private: false, access: { has: obj => "createPayout" in obj, get: obj => obj.createPayout }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _evaluateSLA_decorators, { kind: "method", name: "evaluateSLA", static: false, private: false, access: { has: obj => "evaluateSLA" in obj, get: obj => obj.evaluateSLA }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _applySLAToPayout_decorators, { kind: "method", name: "applySLAToPayout", static: false, private: false, access: { has: obj => "applySLAToPayout" in obj, get: obj => obj.applySLAToPayout }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createQCReport_decorators, { kind: "method", name: "createQCReport", static: false, private: false, access: { has: obj => "createQCReport" in obj, get: obj => obj.createQCReport }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getArtisanQCStats_decorators, { kind: "method", name: "getArtisanQCStats", static: false, private: false, access: { has: obj => "getArtisanQCStats" in obj, get: obj => obj.getArtisanQCStats }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MarketplaceController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MarketplaceController = _classThis;
})();
exports.MarketplaceController = MarketplaceController;
