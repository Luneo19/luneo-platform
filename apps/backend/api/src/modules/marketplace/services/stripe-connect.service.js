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
exports.StripeConnectService = void 0;
const common_1 = require("@nestjs/common");
let StripeConnectService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var StripeConnectService = _classThis = class {
        constructor(prisma, configService) {
            this.prisma = prisma;
            this.configService = configService;
            this.logger = new common_1.Logger(StripeConnectService.name);
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
         * Crée un payout pour un artisan
         */
        async createPayout(artisanId, workOrderIds) {
            const artisan = await this.prisma.artisan.findUnique({
                where: { id: artisanId },
            });
            if (!artisan || !artisan.stripeAccountId) {
                throw new Error(`Artisan ${artisanId} not found or Stripe account not set up`);
            }
            // Récupérer les work orders
            const workOrders = await this.prisma.workOrder.findMany({
                where: {
                    id: { in: workOrderIds },
                    artisanId,
                    payoutStatus: 'pending',
                },
            });
            if (workOrders.length === 0) {
                throw new Error('No pending work orders found');
            }
            // Calculer le montant total
            const totalAmountCents = workOrders.reduce((sum, wo) => sum + (wo.payoutAmountCents || 0), 0);
            const feesCents = Math.round(totalAmountCents * 0.02); // 2% fees
            const netAmountCents = totalAmountCents - feesCents;
            // Créer le payout dans la DB
            const payout = await this.prisma.payout.create({
                data: {
                    artisanId,
                    amountCents: totalAmountCents,
                    feesCents,
                    netAmountCents,
                    workOrderIds,
                    periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 derniers jours
                    periodEnd: new Date(),
                    status: 'pending',
                },
            });
            try {
                // Créer le transfer Stripe
                const stripe = await this.getStripe();
                const transfer = await stripe.transfers.create({
                    amount: netAmountCents,
                    currency: 'eur',
                    destination: artisan.stripeAccountId,
                    metadata: {
                        payoutId: payout.id,
                        workOrderIds: workOrderIds.join(','),
                    },
                });
                // Mettre à jour le payout
                await this.prisma.payout.update({
                    where: { id: payout.id },
                    data: {
                        stripeTransferId: transfer.id,
                        status: 'processing',
                    },
                });
                // Mettre à jour les work orders
                await this.prisma.workOrder.updateMany({
                    where: { id: { in: workOrderIds } },
                    data: {
                        payoutStatus: 'processing',
                        payoutId: payout.id,
                    },
                });
                this.logger.log(`Payout ${payout.id} created for artisan ${artisanId}, transfer: ${transfer.id}`);
                return { payout, transfer };
            }
            catch (error) {
                // Marquer le payout comme failed
                await this.prisma.payout.update({
                    where: { id: payout.id },
                    data: {
                        status: 'failed',
                        failureReason: error.message,
                    },
                });
                throw error;
            }
        }
        /**
         * Traite les payouts automatiquement (scheduler)
         */
        async processScheduledPayouts() {
            const artisans = await this.prisma.artisan.findMany({
                where: {
                    status: 'active',
                    stripeAccountId: { not: null },
                },
            });
            for (const artisan of artisans) {
                try {
                    // Récupérer les work orders en attente de payout
                    const pendingWorkOrders = await this.prisma.workOrder.findMany({
                        where: {
                            artisanId: artisan.id,
                            payoutStatus: 'pending',
                            status: 'completed',
                        },
                    });
                    if (pendingWorkOrders.length === 0) {
                        continue;
                    }
                    // Vérifier le schedule
                    const shouldPayout = this.shouldPayout(artisan.payoutSchedule, artisan.id);
                    if (shouldPayout) {
                        const workOrderIds = pendingWorkOrders.map((wo) => wo.id);
                        await this.createPayout(artisan.id, workOrderIds);
                    }
                }
                catch (error) {
                    this.logger.error(`Failed to process payout for artisan ${artisan.id}:`, error);
                }
            }
        }
        /**
         * Détermine si un payout doit être effectué selon le schedule
         */
        shouldPayout(schedule, artisanId) {
            // TODO: Implémenter logique de schedule (daily, weekly, etc.)
            // Pour l'instant, weekly par défaut
            return true;
        }
        /**
         * Webhook Stripe pour les transfers
         */
        async handleTransferWebhook(event) {
            const transfer = event.data.object;
            // Trouver le payout correspondant
            const payout = await this.prisma.payout.findFirst({
                where: { stripeTransferId: transfer.id },
            });
            if (!payout) {
                this.logger.warn(`Payout not found for transfer ${transfer.id}`);
                return;
            }
            // Mettre à jour le statut
            let status = 'processing';
            if (transfer.reversed) {
                status = 'failed';
            }
            else if (transfer.amount_reversed > 0) {
                status = 'failed';
            }
            else {
                status = 'paid';
            }
            await this.prisma.payout.update({
                where: { id: payout.id },
                data: {
                    status,
                    paidAt: status === 'paid' ? new Date() : null,
                    failureReason: status === 'failed' ? 'Transfer reversed' : null,
                },
            });
            // Mettre à jour les work orders
            if (status === 'paid') {
                await this.prisma.workOrder.updateMany({
                    where: { payoutId: payout.id },
                    data: {
                        payoutStatus: 'paid',
                    },
                });
            }
        }
    };
    __setFunctionName(_classThis, "StripeConnectService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        StripeConnectService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return StripeConnectService = _classThis;
})();
exports.StripeConnectService = StripeConnectService;
