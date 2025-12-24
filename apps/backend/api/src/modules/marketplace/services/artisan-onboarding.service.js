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
exports.ArtisanOnboardingService = void 0;
const common_1 = require("@nestjs/common");
const app_error_1 = require("@/common/errors/app-error");
let ArtisanOnboardingService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ArtisanOnboardingService = _classThis = class {
        constructor(prisma, configService) {
            this.prisma = prisma;
            this.configService = configService;
            this.logger = new common_1.Logger(ArtisanOnboardingService.name);
            this.stripeInstance = null;
        }
        /**
         * Lazy load Stripe
         */
        async getStripe() {
            if (!this.stripeInstance) {
                const stripeModule = await Promise.resolve().then(() => __importStar(require('stripe')));
                this.stripeInstance = new stripeModule.default(this.configService.get('stripe.secretKey'), { apiVersion: '2023-10-16' });
            }
            return this.stripeInstance;
        }
        /**
         * Crée un artisan et démarre l'onboarding
         */
        async createArtisan(request) {
            // Vérifier que l'utilisateur existe et a le rôle FABRICATOR
            const user = await this.prisma.user.findUnique({
                where: { id: request.userId },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    brandId: true,
                },
            });
            if (!user) {
                throw app_error_1.AppErrorFactory.notFound('User', request.userId, { operation: 'createArtisan' });
            }
            // Vérifier qu'il n'y a pas déjà un artisan pour cet utilisateur
            const existing = await this.prisma.artisan.findUnique({
                where: { userId: request.userId },
                select: {
                    id: true,
                    userId: true,
                },
            });
            if (existing) {
                throw app_error_1.AppErrorFactory.conflict('Artisan already exists for this user', {
                    userId: request.userId,
                    existingArtisanId: existing.id,
                });
            }
            // Créer l'artisan
            const artisan = await this.prisma.artisan.create({
                data: {
                    userId: request.userId,
                    businessName: request.businessName,
                    legalName: request.legalName,
                    taxId: request.taxId,
                    address: request.address,
                    phone: request.phone,
                    email: request.email,
                    website: request.website,
                    supportedMaterials: request.supportedMaterials,
                    supportedTechniques: request.supportedTechniques,
                    maxVolume: request.maxVolume || 10,
                    averageLeadTime: request.averageLeadTime || 7,
                    minOrderValue: request.minOrderValue || 0,
                    kycStatus: 'pending',
                    status: 'inactive', // Inactif jusqu'à vérification KYC
                },
            });
            // Créer le compte Stripe Connect
            const stripeAccount = await this.createStripeConnectAccount(artisan.id, request);
            // Mettre à jour avec Stripe account ID
            await this.prisma.artisan.update({
                where: { id: artisan.id },
                data: {
                    stripeAccountId: stripeAccount.id,
                    stripeAccountStatus: stripeAccount.details_submitted ? 'active' : 'pending',
                },
            });
            this.logger.log(`Artisan ${artisan.id} created, Stripe Connect account: ${stripeAccount.id}`);
            return {
                artisan,
                stripeAccountId: stripeAccount.id,
                onboardingUrl: stripeAccount.onboardingUrl,
            };
        }
        /**
         * Crée un compte Stripe Connect
         */
        async createStripeConnectAccount(artisanId, request) {
            const stripe = await this.getStripe();
            // Créer le compte Connect
            const account = await stripe.accounts.create({
                type: 'express',
                country: request.address?.country || 'FR',
                email: request.email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                metadata: {
                    artisanId,
                    businessName: request.businessName,
                },
            });
            // Créer le lien d'onboarding
            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: `${this.configService.get('app.url')}/artisan/onboarding/refresh`,
                return_url: `${this.configService.get('app.url')}/artisan/onboarding/complete`,
                type: 'account_onboarding',
            });
            return {
                id: account.id,
                onboardingUrl: accountLink.url,
                details_submitted: account.details_submitted,
            };
        }
        /**
         * Soumet des documents KYC
         */
        async submitKYCDocuments(artisanId, documents) {
            const artisan = await this.prisma.artisan.findUnique({
                where: { id: artisanId },
            });
            if (!artisan) {
                throw app_error_1.AppErrorFactory.notFound('Artisan', artisanId);
            }
            // Sauvegarder les documents
            const kycDocuments = artisan.kycDocuments || [];
            kycDocuments.push(...documents);
            await this.prisma.artisan.update({
                where: { id: artisanId },
                data: {
                    kycDocuments: kycDocuments,
                    kycStatus: 'pending', // En attente de vérification
                },
            });
            // TODO: Intégrer service de vérification KYC (ex: Onfido, Jumio)
            // Pour l'instant, marquer comme "pending"
            return { status: 'pending', message: 'Documents submitted, verification in progress' };
        }
        /**
         * Vérifie manuellement un artisan (admin)
         */
        async verifyArtisan(artisanId, verified, reason) {
            const artisan = await this.prisma.artisan.findUnique({
                where: { id: artisanId },
            });
            if (!artisan) {
                throw app_error_1.AppErrorFactory.notFound('Artisan', artisanId);
            }
            await this.prisma.artisan.update({
                where: { id: artisanId },
                data: {
                    kycStatus: verified ? 'verified' : 'rejected',
                    kycVerifiedAt: verified ? new Date() : null,
                    status: verified ? 'active' : 'suspended',
                },
            });
            this.logger.log(`Artisan ${artisanId} ${verified ? 'verified' : 'rejected'}: ${reason}`);
            return { verified, reason };
        }
        /**
         * Ajoute une capacité (matériau/technique)
         */
        async addCapability(artisanId, material, technique, options) {
            const artisan = await this.prisma.artisan.findUnique({
                where: { id: artisanId },
            });
            if (!artisan) {
                throw app_error_1.AppErrorFactory.notFound('Artisan', artisanId);
            }
            const capability = await this.prisma.artisanCapability.create({
                data: {
                    artisanId,
                    material,
                    technique,
                    maxSize: options?.maxSize,
                    minSize: options?.minSize,
                    leadTime: options?.leadTime,
                    costMultiplier: options?.costMultiplier || 1.0,
                },
            });
            return capability;
        }
        /**
         * Met à jour les capacités d'un artisan
         */
        async updateCapabilities(artisanId, capabilities) {
            // Supprimer les anciennes capacités
            await this.prisma.artisanCapability.deleteMany({
                where: { artisanId },
            });
            // Créer les nouvelles
            await this.prisma.artisanCapability.createMany({
                data: capabilities.map((cap) => ({
                    artisanId,
                    ...cap,
                })),
            });
            return { updated: capabilities.length };
        }
    };
    __setFunctionName(_classThis, "ArtisanOnboardingService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ArtisanOnboardingService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ArtisanOnboardingService = _classThis;
})();
exports.ArtisanOnboardingService = ArtisanOnboardingService;
