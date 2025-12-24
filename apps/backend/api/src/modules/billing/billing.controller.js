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
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const common_2 = require("@nestjs/common");
let BillingController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Billing'), (0, common_1.Controller)('billing')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createCheckoutSession_decorators;
    let _createCustomerPortalSession_decorators;
    let _handleWebhook_decorators;
    var BillingController = _classThis = class {
        constructor(billingService) {
            this.billingService = (__runInitializers(this, _instanceExtraInitializers), billingService);
            this.logger = new common_2.Logger(BillingController.name);
        }
        async createCheckoutSession(body) {
            try {
                // Pour les utilisateurs non connectés, on utilise l'email fourni
                const userId = 'anonymous';
                const userEmail = body.email || 'user@example.com';
                const result = await this.billingService.createCheckoutSession(body.planId, userId, userEmail);
                return result;
            }
            catch (error) {
                return {
                    success: false,
                    error: error.message,
                };
            }
        }
        async createCustomerPortalSession(req) {
            try {
                const result = await this.billingService.createCustomerPortalSession(req.user.id);
                return result;
            }
            catch (error) {
                return {
                    success: false,
                    error: error.message,
                };
            }
        }
        async handleWebhook(body) {
            // Ici vous pouvez ajouter la logique pour traiter les webhooks Stripe
            this.logger.log('Webhook Stripe reçu:', body);
            return { received: true };
        }
    };
    __setFunctionName(_classThis, "BillingController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createCheckoutSession_decorators = [(0, public_decorator_1.Public)(), (0, common_1.Post)('create-checkout-session'), (0, swagger_1.ApiOperation)({ summary: 'Créer une session de paiement Stripe' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Session créée avec succès' })];
        _createCustomerPortalSession_decorators = [(0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, common_1.Get)('customer-portal'), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Créer une session pour le portail client Stripe' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Session créée avec succès' })];
        _handleWebhook_decorators = [(0, public_decorator_1.Public)(), (0, common_1.Post)('webhook'), (0, swagger_1.ApiOperation)({ summary: 'Webhook Stripe pour les événements de paiement' })];
        __esDecorate(_classThis, null, _createCheckoutSession_decorators, { kind: "method", name: "createCheckoutSession", static: false, private: false, access: { has: obj => "createCheckoutSession" in obj, get: obj => obj.createCheckoutSession }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createCustomerPortalSession_decorators, { kind: "method", name: "createCustomerPortalSession", static: false, private: false, access: { has: obj => "createCustomerPortalSession" in obj, get: obj => obj.createCustomerPortalSession }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleWebhook_decorators, { kind: "method", name: "handleWebhook", static: false, private: false, access: { has: obj => "handleWebhook" in obj, get: obj => obj.handleWebhook }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BillingController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BillingController = _classThis;
})();
exports.BillingController = BillingController;
