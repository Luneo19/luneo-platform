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
exports.PlansController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let PlansController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Plans'), (0, common_1.Controller)('plans'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getCurrentPlan_decorators;
    let _getLimits_decorators;
    let _checkDesignLimit_decorators;
    let _checkTeamLimit_decorators;
    let _upgradePlan_decorators;
    let _hasFeature_decorators;
    var PlansController = _classThis = class {
        constructor(plansService) {
            this.plansService = (__runInitializers(this, _instanceExtraInitializers), plansService);
        }
        async getCurrentPlan(req) {
            const plan = await this.plansService.getUserPlan(req.user.id);
            const limits = await this.plansService.getUserLimits(req.user.id);
            const planInfo = this.plansService.getPlanInfo(plan);
            return {
                plan,
                limits,
                info: planInfo
            };
        }
        async getLimits(req) {
            const limits = await this.plansService.getUserLimits(req.user.id);
            const designLimit = await this.plansService.checkDesignLimit(req.user.id);
            const teamLimit = await this.plansService.checkTeamLimit(req.user.id);
            return {
                limits,
                usage: {
                    designs: designLimit,
                    team: teamLimit
                }
            };
        }
        async checkDesignLimit(req) {
            return await this.plansService.checkDesignLimit(req.user.id);
        }
        async checkTeamLimit(req) {
            return await this.plansService.checkTeamLimit(req.user.id);
        }
        async upgradePlan(req, body) {
            await this.plansService.upgradeUserPlan(req.user.id, body.plan);
            return {
                success: true,
                message: 'Plan upgradé avec succès',
                newPlan: body.plan
            };
        }
        async hasFeature(req, feature) {
            const hasAccess = await this.plansService.hasFeature(req.user.id, feature);
            return {
                feature,
                hasAccess
            };
        }
    };
    __setFunctionName(_classThis, "PlansController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getCurrentPlan_decorators = [(0, common_1.Get)('current'), (0, swagger_1.ApiOperation)({ summary: 'Récupérer le plan actuel de l\'utilisateur' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Plan actuel récupéré avec succès' })];
        _getLimits_decorators = [(0, common_1.Get)('limits'), (0, swagger_1.ApiOperation)({ summary: 'Récupérer les limites du plan actuel' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Limites récupérées avec succès' })];
        _checkDesignLimit_decorators = [(0, common_1.Get)('designs/check'), (0, swagger_1.ApiOperation)({ summary: 'Vérifier si l\'utilisateur peut créer un design' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Vérification effectuée avec succès' })];
        _checkTeamLimit_decorators = [(0, common_1.Get)('team/check'), (0, swagger_1.ApiOperation)({ summary: 'Vérifier si l\'utilisateur peut inviter un membre' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Vérification effectuée avec succès' })];
        _upgradePlan_decorators = [(0, common_1.Post)('upgrade'), (0, swagger_1.ApiOperation)({ summary: 'Upgrader le plan de l\'utilisateur' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Plan upgradé avec succès' })];
        _hasFeature_decorators = [(0, common_1.Get)('features/:feature'), (0, swagger_1.ApiOperation)({ summary: 'Vérifier si l\'utilisateur a accès à une fonctionnalité' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Vérification effectuée avec succès' })];
        __esDecorate(_classThis, null, _getCurrentPlan_decorators, { kind: "method", name: "getCurrentPlan", static: false, private: false, access: { has: obj => "getCurrentPlan" in obj, get: obj => obj.getCurrentPlan }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getLimits_decorators, { kind: "method", name: "getLimits", static: false, private: false, access: { has: obj => "getLimits" in obj, get: obj => obj.getLimits }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _checkDesignLimit_decorators, { kind: "method", name: "checkDesignLimit", static: false, private: false, access: { has: obj => "checkDesignLimit" in obj, get: obj => obj.checkDesignLimit }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _checkTeamLimit_decorators, { kind: "method", name: "checkTeamLimit", static: false, private: false, access: { has: obj => "checkTeamLimit" in obj, get: obj => obj.checkTeamLimit }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _upgradePlan_decorators, { kind: "method", name: "upgradePlan", static: false, private: false, access: { has: obj => "upgradePlan" in obj, get: obj => obj.upgradePlan }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _hasFeature_decorators, { kind: "method", name: "hasFeature", static: false, private: false, access: { has: obj => "hasFeature" in obj, get: obj => obj.hasFeature }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PlansController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PlansController = _classThis;
})();
exports.PlansController = PlansController;
