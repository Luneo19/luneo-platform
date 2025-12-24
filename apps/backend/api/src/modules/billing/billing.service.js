"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
let BillingService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var BillingService = _classThis = class {
        constructor(configService) {
            this.configService = configService;
            this.logger = new common_2.Logger(BillingService.name);
            this.stripeInstance = null;
            this.stripeModule = null;
        }
        /**
         * Lazy load Stripe module to reduce cold start time
         */
        async getStripe() {
            if (!this.stripeInstance) {
                if (!this.stripeModule) {
                    this.stripeModule = await Promise.resolve().then(() => __importStar(require('stripe')));
                }
                const secretKey = this.configService.get('stripe.secretKey');
                if (!secretKey) {
                    throw new Error('STRIPE_SECRET_KEY is not configured');
                }
                this.stripeInstance = new this.stripeModule.default(secretKey, {
                    apiVersion: '2023-10-16',
                });
            }
            return this.stripeInstance;
        }
        async createCheckoutSession(planId, userId, userEmail) {
            const planPrices = {
                starter: null, // Gratuit
                professional: this.configService.get('stripe.pricePro'),
                business: this.configService.get('stripe.priceBusiness'),
                enterprise: this.configService.get('stripe.priceEnterprise')
            };
            const priceId = planPrices[planId];
            if (!priceId) {
                throw new Error(`Plan ${planId} not found`);
            }
            // Tous les plans sont maintenant configurés dans Stripe
            try {
                const stripe = await this.getStripe();
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: [
                        {
                            price: priceId,
                            quantity: 1,
                        },
                    ],
                    mode: 'subscription',
                    customer_email: userEmail,
                    success_url: `${this.configService.get('stripe.successUrl')}?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: this.configService.get('stripe.cancelUrl'),
                    metadata: {
                        userId,
                        planId,
                    },
                    // Essai gratuit de 14 jours
                    subscription_data: {
                        trial_period_days: 14,
                    },
                });
                return {
                    success: true,
                    url: session.url,
                };
            }
            catch (error) {
                this.logger.error('Erreur création session Stripe:', error);
                throw new Error('Erreur lors de la création de la session de paiement');
            }
        }
        async createCustomerPortalSession(userId) {
            try {
                const stripe = await this.getStripe();
                // Ici vous devriez récupérer le customer_id depuis votre base de données
                // Pour l'instant, on utilise un placeholder
                const customerId = `cus_${userId}`;
                const session = await stripe.billingPortal.sessions.create({
                    customer: customerId,
                    return_url: `${this.configService.get('app.frontendUrl')}/dashboard/billing`,
                });
                return {
                    success: true,
                    url: session.url,
                };
            }
            catch (error) {
                this.logger.error('Erreur création session portal:', error);
                throw new Error('Erreur lors de la création de la session du portail client');
            }
        }
    };
    __setFunctionName(_classThis, "BillingService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BillingService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BillingService = _classThis;
})();
exports.BillingService = BillingService;
