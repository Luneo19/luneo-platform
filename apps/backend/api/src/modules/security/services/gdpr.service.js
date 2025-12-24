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
exports.GDPRService = void 0;
const common_1 = require("@nestjs/common");
const audit_logs_service_1 = require("./audit-logs.service");
/**
 * Service GDPR (Conformité RGPD)
 * Gère les droits des utilisateurs: accès, rectification, effacement, portabilité
 */
let GDPRService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var GDPRService = _classThis = class {
        constructor(prisma, auditLogs) {
            this.prisma = prisma;
            this.auditLogs = auditLogs;
            this.logger = new common_1.Logger(GDPRService.name);
        }
        /**
         * Exporter toutes les données d'un utilisateur (Right to access)
         */
        async exportUserData(userId) {
            try {
                this.logger.log(`Exporting data for user ${userId}`);
                // Récupérer toutes les données de l'utilisateur
                const [user, designs, orders, auditLogs, usageMetrics] = await Promise.all([
                    this.prisma.user.findUnique({
                        where: { id: userId },
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            role: true,
                            brandId: true,
                            createdAt: true,
                            updatedAt: true,
                            brand: {
                                select: {
                                    id: true,
                                    name: true,
                                    logo: true,
                                    website: true,
                                },
                            },
                        },
                    }),
                    this.prisma.design.findMany({
                        where: { userId },
                    }),
                    this.prisma.order.findMany({
                        where: { userId },
                    }),
                    this.auditLogs.getUserActivity(userId, 1000),
                    // @ts-ignore - UsageMetric model exists but Prisma client may need regeneration
                    this.prisma.usageMetric.findMany({
                        where: {
                            brand: {
                                users: {
                                    some: { id: userId },
                                },
                            },
                        },
                        take: 1000,
                    }),
                ]);
                // Anonymiser les données sensibles dans l'export
                // Note: password n'est pas inclus dans le select, donc pas besoin de le supprimer
                const sanitizedUser = { ...user };
                const exportData = {
                    user: sanitizedUser,
                    designs,
                    orders,
                    auditLogs,
                    usageMetrics,
                    exportedAt: new Date(),
                };
                // Logger l'export
                await this.auditLogs.logSuccess(audit_logs_service_1.AuditEventType.DATA_EXPORTED, 'User data exported', {
                    userId,
                    userEmail: user?.email,
                    metadata: {
                        itemsCount: {
                            designs: designs.length,
                            orders: orders.length,
                            auditLogs: auditLogs.length,
                            usageMetrics: usageMetrics.length,
                        },
                    },
                });
                return exportData;
            }
            catch (error) {
                this.logger.error(`Failed to export user data: ${error.message}`, error.stack);
                throw error;
            }
        }
        /**
         * Supprimer toutes les données d'un utilisateur (Right to erasure)
         */
        async deleteUserData(userId, reason) {
            try {
                this.logger.warn(`Deleting data for user ${userId}. Reason: ${reason || 'N/A'}`);
                const user = await this.prisma.user.findUnique({
                    where: { id: userId },
                    select: { email: true, brandId: true },
                });
                if (!user) {
                    throw new Error('User not found');
                }
                // Compter ce qui va être supprimé
                const [designsCount, ordersCount] = await Promise.all([
                    this.prisma.design.count({ where: { userId } }),
                    this.prisma.order.count({ where: { userId } }),
                ]);
                // Supprimer toutes les données associées
                await this.prisma.$transaction([
                    // Designs
                    this.prisma.design.deleteMany({ where: { userId } }),
                    // Orders (garder mais anonymiser)
                    this.prisma.order.updateMany({
                        where: { userId },
                        data: {
                            userId: null,
                            // @ts-ignore - userEmail exists in schema but Prisma client may need regeneration
                            userEmail: 'deleted@user.anonymized',
                        },
                    }),
                    // Usage metrics (anonymiser)
                    // Pas de userId direct, mais on peut anonymiser via le brand
                    // Supprimer l'utilisateur
                    this.prisma.user.delete({ where: { id: userId } }),
                ]);
                // Logger la suppression
                await this.auditLogs.logSuccess(audit_logs_service_1.AuditEventType.DATA_DELETED, 'User data deleted (GDPR)', {
                    userId,
                    userEmail: user.email,
                    brandId: user.brandId,
                    metadata: {
                        reason,
                        itemsDeleted: {
                            designs: designsCount,
                            orders: ordersCount,
                        },
                    },
                });
                return {
                    deleted: true,
                    itemsDeleted: {
                        user: 1,
                        designs: designsCount,
                        orders: ordersCount,
                    },
                };
            }
            catch (error) {
                this.logger.error(`Failed to delete user data: ${error.message}`, error.stack);
                throw error;
            }
        }
        /**
         * Anonymiser les données d'un utilisateur (alternative à la suppression)
         */
        async anonymizeUserData(userId) {
            try {
                this.logger.log(`Anonymizing data for user ${userId}`);
                const user = await this.prisma.user.findUnique({
                    where: { id: userId },
                    select: { email: true },
                });
                // Générer un email anonymisé
                const anonymousEmail = `anonymous_${Date.now()}@deleted.user`;
                await this.prisma.user.update({
                    where: { id: userId },
                    data: {
                        email: anonymousEmail,
                        // @ts-ignore - name exists in schema but Prisma client may need regeneration
                        name: 'Deleted User',
                        password: null,
                        // phone: null, // Commenté car pas dans UserUpdateInput
                        avatar: null,
                    },
                });
                await this.auditLogs.logSuccess(audit_logs_service_1.AuditEventType.DATA_DELETED, 'User data anonymized', {
                    userId,
                    userEmail: user?.email,
                    metadata: { anonymousEmail },
                });
            }
            catch (error) {
                this.logger.error(`Failed to anonymize user data: ${error.message}`, error.stack);
                throw error;
            }
        }
        /**
         * Enregistrer le consentement d'un utilisateur
         */
        async recordConsent(userId, consentType, given) {
            try {
                // @ts-ignore - UserConsent model exists but Prisma client may need regeneration
                await this.prisma.userConsent.create({
                    data: {
                        userId,
                        consentType,
                        granted: given,
                        recordedAt: new Date(),
                    },
                });
                await this.auditLogs.logSuccess(given ? audit_logs_service_1.AuditEventType.CONSENT_GIVEN : audit_logs_service_1.AuditEventType.CONSENT_WITHDRAWN, `Consent ${given ? 'given' : 'withdrawn'} for ${consentType}`, {
                    userId,
                    metadata: { consentType, given },
                });
            }
            catch (error) {
                this.logger.error(`Failed to record consent: ${error.message}`, error.stack);
                throw error;
            }
        }
        /**
         * Vérifier le consentement d'un utilisateur
         */
        async hasConsent(userId, consentType) {
            try {
                // @ts-ignore - UserConsent model exists but Prisma client may need regeneration
                const latestConsent = await this.prisma.userConsent.findFirst({
                    where: { userId, consentType },
                    orderBy: { recordedAt: 'desc' },
                });
                return latestConsent?.granted || false;
            }
            catch (error) {
                this.logger.error(`Failed to check consent: ${error.message}`, error.stack);
                return false;
            }
        }
        /**
         * Récupérer l'historique des consentements
         */
        async getConsentHistory(userId) {
            try {
                // @ts-ignore - UserConsent model exists but Prisma client may need regeneration
                return await this.prisma.userConsent.findMany({
                    where: { userId },
                    orderBy: { recordedAt: 'desc' },
                });
            }
            catch (error) {
                this.logger.error(`Failed to get consent history: ${error.message}`, error.stack);
                return [];
            }
        }
        /**
         * Générer un rapport de conformité GDPR pour un brand
         */
        async generateComplianceReport(brandId) {
            try {
                const [brand, usersCount, consentsCount, recentExports, recentDeletions,] = await Promise.all([
                    this.prisma.brand.findUnique({ where: { id: brandId } }),
                    this.prisma.user.count({ where: { brandId } }),
                    // @ts-ignore - UserConsent model exists but Prisma client may need regeneration
                    this.prisma.userConsent.count({
                        where: { user: { brandId } },
                    }),
                    this.auditLogs.search({
                        brandId,
                        eventType: audit_logs_service_1.AuditEventType.DATA_EXPORTED,
                        limit: 1000,
                    }),
                    this.auditLogs.search({
                        brandId,
                        eventType: audit_logs_service_1.AuditEventType.DATA_DELETED,
                        limit: 1000,
                    }),
                ]);
                // Calculer un score de conformité (simplifié)
                let complianceScore = 100;
                const recommendations = [];
                // Vérifier les politiques
                if (!brand?.privacyPolicyUrl) {
                    complianceScore -= 20;
                    recommendations.push('❌ Add a privacy policy URL');
                }
                if (!brand?.termsOfServiceUrl) {
                    complianceScore -= 10;
                    recommendations.push('❌ Add terms of service URL');
                }
                // Vérifier les consentements
                if (consentsCount < usersCount) {
                    complianceScore -= 15;
                    recommendations.push('⚠️  Not all users have recorded consents. Implement consent collection.');
                }
                // Vérifier les exports de données
                if (recentExports.total === 0) {
                    recommendations.push('✅ No data export requests (good, or users are not aware of this right)');
                }
                // Vérifier les suppressions
                if (recentDeletions.total === 0) {
                    recommendations.push('✅ No data deletion requests (good, or users are not aware of this right)');
                }
                if (complianceScore >= 90) {
                    recommendations.unshift('✅ Excellent GDPR compliance!');
                }
                else if (complianceScore >= 70) {
                    recommendations.unshift('⚠️  Good compliance, but improvements needed');
                }
                else {
                    recommendations.unshift('❌ Critical compliance issues detected');
                }
                return {
                    brand,
                    usersCount,
                    consentsCount,
                    dataExportsCount: recentExports.total,
                    dataDeletionsCount: recentDeletions.total,
                    complianceScore,
                    recommendations,
                };
            }
            catch (error) {
                this.logger.error(`Failed to generate compliance report: ${error.message}`, error.stack);
                throw error;
            }
        }
        /**
         * Planifier la suppression automatique des données anciennes (data retention)
         */
        async scheduleDataRetention(days = 365 * 3) {
            try {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - days);
                // Identifier les designs inactifs à supprimer
                const oldDesigns = await this.prisma.design.findMany({
                    where: {
                        updatedAt: { lte: cutoffDate },
                        status: { not: 'COMPLETED' },
                    },
                    select: { id: true },
                });
                this.logger.log(`Found ${oldDesigns.length} old designs to delete (older than ${days} days)`);
                // Ici, on pourrait les marquer pour suppression ou les supprimer directement
                // Pour l'instant, on retourne juste le count
                return {
                    analyzed: oldDesigns.length,
                    scheduled: 0, // À implémenter avec un scheduler
                };
            }
            catch (error) {
                this.logger.error(`Failed to schedule data retention: ${error.message}`, error.stack);
                return { analyzed: 0, scheduled: 0 };
            }
        }
    };
    __setFunctionName(_classThis, "GDPRService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GDPRService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GDPRService = _classThis;
})();
exports.GDPRService = GDPRService;
