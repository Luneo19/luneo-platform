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
exports.QCSystemService = void 0;
const common_1 = require("@nestjs/common");
let QCSystemService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var QCSystemService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
            this.logger = new common_1.Logger(QCSystemService.name);
            // Seuils de quarantaine
            this.QUARANTINE_THRESHOLDS = {
                defectRate: 0.15, // 15% de défauts
                returnRate: 0.20, // 20% de retours
                onTimeRate: 0.70, // 70% à temps
                qualityScore: 3.5, // Score qualité < 3.5/5
            };
        }
        /**
         * Crée un rapport QC
         */
        async createQCReport(report) {
            const workOrder = await this.prisma.workOrder.findUnique({
                where: { id: report.workOrderId },
                include: { artisan: true },
            });
            if (!workOrder) {
                throw new Error(`WorkOrder ${report.workOrderId} not found`);
            }
            // Créer le rapport QC
            const qcReport = await this.prisma.qualityReport.create({
                data: {
                    orderId: report.workOrderId,
                    overallScore: report.overallScore,
                    issues: report.issues.map((i) => i.description),
                    recommendations: report.recommendations,
                    passed: report.passed,
                },
            });
            // Mettre à jour le work order
            await this.prisma.workOrder.update({
                where: { id: report.workOrderId },
                data: {
                    qcScore: report.overallScore,
                    qcPassed: report.passed,
                    qcIssues: report.issues.map((i) => i.description),
                    qcReportId: qcReport.id,
                    status: report.passed ? 'qc_passed' : 'qc_failed',
                },
            });
            // Mettre à jour les stats de l'artisan
            await this.updateArtisanQCStats(workOrder.artisanId, report);
            // Vérifier si quarantaine nécessaire
            await this.checkQuarantine(workOrder.artisanId);
            this.logger.log(`QC report created for workOrder ${report.workOrderId}: ${report.passed ? 'PASSED' : 'FAILED'}, score: ${report.overallScore}`);
            return qcReport;
        }
        /**
         * Met à jour les statistiques QC de l'artisan
         */
        async updateArtisanQCStats(artisanId, report) {
            const artisan = await this.prisma.artisan.findUnique({
                where: { id: artisanId },
            });
            if (!artisan) {
                return;
            }
            // Calculer le nouveau taux de défauts
            const totalOrders = artisan.totalOrders || 0;
            const currentDefectRate = artisan.defectRate || 0.0;
            const newDefectRate = totalOrders > 0
                ? (currentDefectRate * (totalOrders - 1) + (report.passed ? 0 : 1)) / totalOrders
                : (report.passed ? 0 : 1);
            // Mettre à jour le score qualité
            const currentQualityScore = artisan.qualityScore || 5.0;
            const newQualityScore = totalOrders > 0
                ? (currentQualityScore * (totalOrders - 1) + report.overallScore) / totalOrders
                : report.overallScore;
            await this.prisma.artisan.update({
                where: { id: artisanId },
                data: {
                    defectRate: newDefectRate,
                    qualityScore: newQualityScore,
                },
            });
        }
        /**
         * Vérifie si un artisan doit être mis en quarantaine
         */
        async checkQuarantine(artisanId) {
            const artisan = await this.prisma.artisan.findUnique({
                where: { id: artisanId },
            });
            if (!artisan) {
                return;
            }
            const shouldQuarantine = artisan.defectRate >= this.QUARANTINE_THRESHOLDS.defectRate ||
                artisan.returnRate >= this.QUARANTINE_THRESHOLDS.returnRate ||
                artisan.onTimeDeliveryRate < this.QUARANTINE_THRESHOLDS.onTimeRate ||
                artisan.qualityScore < this.QUARANTINE_THRESHOLDS.qualityScore;
            if (shouldQuarantine && artisan.status !== 'quarantined') {
                // Mettre en quarantaine
                await this.prisma.artisan.update({
                    where: { id: artisanId },
                    data: {
                        status: 'quarantined',
                        quarantineReason: this.generateQuarantineReason(artisan),
                        quarantineUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
                    },
                });
                this.logger.warn(`Artisan ${artisanId} quarantined due to poor performance`);
            }
            else if (!shouldQuarantine && artisan.status === 'quarantined') {
                // Retirer de la quarantaine si les seuils sont respectés
                await this.prisma.artisan.update({
                    where: { id: artisanId },
                    data: {
                        status: 'active',
                        quarantineReason: null,
                        quarantineUntil: null,
                    },
                });
                this.logger.log(`Artisan ${artisanId} removed from quarantine`);
            }
        }
        /**
         * Génère la raison de quarantaine
         */
        generateQuarantineReason(artisan) {
            const reasons = [];
            if (artisan.defectRate >= this.QUARANTINE_THRESHOLDS.defectRate) {
                reasons.push(`High defect rate: ${(artisan.defectRate * 100).toFixed(1)}%`);
            }
            if (artisan.returnRate >= this.QUARANTINE_THRESHOLDS.returnRate) {
                reasons.push(`High return rate: ${(artisan.returnRate * 100).toFixed(1)}%`);
            }
            if (artisan.onTimeDeliveryRate < this.QUARANTINE_THRESHOLDS.onTimeRate) {
                reasons.push(`Low on-time rate: ${(artisan.onTimeDeliveryRate * 100).toFixed(1)}%`);
            }
            if (artisan.qualityScore < this.QUARANTINE_THRESHOLDS.qualityScore) {
                reasons.push(`Low quality score: ${artisan.qualityScore.toFixed(1)}/5`);
            }
            return reasons.join(', ');
        }
        /**
         * Récupère les statistiques QC d'un artisan
         */
        async getArtisanQCStats(artisanId) {
            const artisan = await this.prisma.artisan.findUnique({
                where: { id: artisanId },
            });
            if (!artisan) {
                throw new Error(`Artisan ${artisanId} not found`);
            }
            // Récupérer les rapports QC récents
            const recentReports = await this.prisma.qualityReport.findMany({
                where: {
                    orderId: {
                        in: await this.prisma.workOrder
                            .findMany({
                            where: { artisanId },
                            select: { id: true },
                        })
                            .then((wos) => wos.map((wo) => wo.id)),
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            });
            return {
                artisan: {
                    qualityScore: artisan.qualityScore,
                    defectRate: artisan.defectRate,
                    returnRate: artisan.returnRate,
                    onTimeDeliveryRate: artisan.onTimeDeliveryRate,
                    totalOrders: artisan.totalOrders,
                    completedOrders: artisan.completedOrders,
                },
                recentReports: recentReports.map((r) => ({
                    score: r.overallScore,
                    passed: r.passed,
                    issues: r.issues,
                    createdAt: r.createdAt,
                })),
            };
        }
    };
    __setFunctionName(_classThis, "QCSystemService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        QCSystemService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return QCSystemService = _classThis;
})();
exports.QCSystemService = QCSystemService;
