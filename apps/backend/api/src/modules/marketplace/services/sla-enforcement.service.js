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
exports.SLAEnforcementService = void 0;
const common_1 = require("@nestjs/common");
let SLAEnforcementService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SLAEnforcementService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
            this.logger = new common_1.Logger(SLAEnforcementService.name);
            // Configuration SLA par niveau
            this.SLA_CONFIG = {
                basic: {
                    penaltyRate: 0.05, // 5% du montant
                    bonusRate: 0.0, // Pas de bonus
                    maxPenalty: 0.1, // 10% max
                },
                standard: {
                    penaltyRate: 0.03, // 3%
                    bonusRate: 0.02, // 2%
                    maxPenalty: 0.08,
                },
                premium: {
                    penaltyRate: 0.02, // 2%
                    bonusRate: 0.03, // 3%
                    maxPenalty: 0.05,
                },
                enterprise: {
                    penaltyRate: 0.01, // 1%
                    bonusRate: 0.05, // 5%
                    maxPenalty: 0.03,
                },
            };
        }
        /**
         * Évalue le SLA d'un work order
         */
        async evaluateSLA(workOrderId) {
            const workOrder = await this.prisma.workOrder.findUnique({
                where: { id: workOrderId },
                include: { artisan: true },
            });
            if (!workOrder || !workOrder.slaDeadline) {
                throw new Error(`WorkOrder ${workOrderId} not found or no SLA deadline`);
            }
            const artisan = workOrder.artisan;
            const slaLevel = artisan.slaLevel || 'standard';
            const config = this.SLA_CONFIG[slaLevel];
            const now = new Date();
            const deadline = workOrder.slaDeadline;
            const completedAt = workOrder.completedAt;
            let onTime = false;
            let delayHours = 0;
            let penaltyCents = 0;
            let bonusCents = 0;
            let reason = '';
            if (completedAt) {
                // Commande terminée
                if (completedAt <= deadline) {
                    onTime = true;
                    delayHours = 0;
                    // Bonus si terminé en avance
                    const hoursEarly = (deadline.getTime() - completedAt.getTime()) / (1000 * 60 * 60);
                    if (hoursEarly >= 24) {
                        // 24h+ en avance
                        bonusCents = Math.round((workOrder.payoutAmountCents || 0) * config.bonusRate);
                        reason = `Completed ${Math.round(hoursEarly)} hours early`;
                    }
                }
                else {
                    onTime = false;
                    delayHours = (completedAt.getTime() - deadline.getTime()) / (1000 * 60 * 60);
                    // Pénalité basée sur le retard
                    const penaltyRate = Math.min(config.penaltyRate * (1 + delayHours / 24), // +1% par jour de retard
                    config.maxPenalty);
                    penaltyCents = Math.round((workOrder.payoutAmountCents || 0) * penaltyRate);
                    reason = `Delayed by ${Math.round(delayHours)} hours`;
                }
            }
            else {
                // Commande en cours
                if (now > deadline) {
                    onTime = false;
                    delayHours = (now.getTime() - deadline.getTime()) / (1000 * 60 * 60);
                    // Pénalité pour retard en cours
                    const penaltyRate = Math.min(config.penaltyRate * (1 + delayHours / 24), config.maxPenalty);
                    penaltyCents = Math.round((workOrder.payoutAmountCents || 0) * penaltyRate);
                    reason = `Currently delayed by ${Math.round(delayHours)} hours`;
                }
                else {
                    onTime = true; // Pas encore en retard
                    reason = 'On track';
                }
            }
            // Créer ou mettre à jour le SLA record
            const slaRecord = await this.prisma.sLARecord.upsert({
                where: { workOrderId },
                create: {
                    workOrderId,
                    artisanId: artisan.id,
                    deadline,
                    completedAt: completedAt || null,
                    onTime,
                    delayHours: Math.round(delayHours),
                    penaltyCents,
                    bonusCents,
                    reason,
                },
                update: {
                    completedAt: completedAt || null,
                    onTime,
                    delayHours: Math.round(delayHours),
                    penaltyCents,
                    bonusCents,
                    reason,
                },
            });
            // Mettre à jour le work order
            await this.prisma.workOrder.update({
                where: { id: workOrderId },
                data: {
                    slaMet: onTime,
                    slaPenaltyCents: penaltyCents,
                    slaBonusCents: bonusCents,
                },
            });
            // Mettre à jour les stats de l'artisan
            await this.updateArtisanStats(artisan.id, onTime, delayHours);
            this.logger.log(`SLA evaluated for workOrder ${workOrderId}: ${onTime ? 'MET' : 'FAILED'}, penalty: ${penaltyCents}cents, bonus: ${bonusCents}cents`);
            return slaRecord;
        }
        /**
         * Met à jour les statistiques de l'artisan
         */
        async updateArtisanStats(artisanId, onTime, delayHours) {
            const artisan = await this.prisma.artisan.findUnique({
                where: { id: artisanId },
            });
            if (!artisan) {
                return;
            }
            // Calculer le nouveau taux de livraison à temps
            const totalOrders = artisan.totalOrders || 0;
            const completedOrders = artisan.completedOrders || 0;
            const currentOnTimeRate = artisan.onTimeDeliveryRate || 1.0;
            // Mise à jour simple (moyenne mobile)
            const newOnTimeRate = totalOrders > 0
                ? (currentOnTimeRate * (totalOrders - 1) + (onTime ? 1 : 0)) / totalOrders
                : (onTime ? 1 : 0);
            await this.prisma.artisan.update({
                where: { id: artisanId },
                data: {
                    onTimeDeliveryRate: newOnTimeRate,
                    totalOrders: totalOrders + 1,
                    completedOrders: completedOrders + (onTime ? 1 : 0),
                },
            });
        }
        /**
         * Évalue tous les SLA en cours (scheduler)
         */
        async evaluateAllActiveSLAs() {
            const activeWorkOrders = await this.prisma.workOrder.findMany({
                where: {
                    status: { in: ['assigned', 'accepted', 'in_progress', 'qc_pending'] },
                    slaDeadline: { not: null },
                },
                include: { artisan: true },
            });
            for (const workOrder of activeWorkOrders) {
                try {
                    await this.evaluateSLA(workOrder.id);
                }
                catch (error) {
                    this.logger.error(`Failed to evaluate SLA for workOrder ${workOrder.id}:`, error);
                }
            }
        }
        /**
         * Applique les pénalités/bonus au payout
         */
        async applySLAToPayout(payoutId) {
            const payout = await this.prisma.payout.findUnique({
                where: { id: payoutId },
                include: {
                    artisan: true,
                },
            });
            if (!payout) {
                throw new Error(`Payout ${payoutId} not found`);
            }
            // Récupérer les SLA records pour les work orders
            const slaRecords = await this.prisma.sLARecord.findMany({
                where: {
                    workOrderId: { in: payout.workOrderIds },
                },
            });
            const totalPenalties = slaRecords.reduce((sum, record) => sum + record.penaltyCents, 0);
            const totalBonuses = slaRecords.reduce((sum, record) => sum + record.bonusCents, 0);
            // Ajuster le montant du payout
            const adjustedAmount = payout.amountCents - totalPenalties + totalBonuses;
            const adjustedNet = adjustedAmount - payout.feesCents;
            await this.prisma.payout.update({
                where: { id: payoutId },
                data: {
                    amountCents: adjustedAmount,
                    netAmountCents: adjustedNet,
                },
            });
            return { totalPenalties, totalBonuses, adjustedAmount, adjustedNet };
        }
    };
    __setFunctionName(_classThis, "SLAEnforcementService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SLAEnforcementService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SLAEnforcementService = _classThis;
})();
exports.SLAEnforcementService = SLAEnforcementService;
