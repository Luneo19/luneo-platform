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
exports.ZonesService = void 0;
const common_1 = require("@nestjs/common");
let ZonesService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ZonesService = _classThis = class {
        constructor(prisma, cache) {
            this.prisma = prisma;
            this.cache = cache;
            this.logger = new common_1.Logger(ZonesService.name);
        }
        /**
         * Crée une nouvelle zone pour un produit
         */
        async createZone(productId, zone) {
            try {
                const product = await this.prisma.product.findUnique({
                    where: { id: productId },
                    select: { rulesJson: true },
                });
                if (!product) {
                    throw new Error(`Product ${productId} not found`);
                }
                const rules = product.rulesJson || { zones: [] };
                // Générer un ID unique pour la zone
                const zoneId = `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const newZone = {
                    ...zone,
                    id: zoneId,
                };
                rules.zones.push(newZone);
                // Sauvegarder les règles mises à jour
                await this.prisma.product.update({
                    where: { id: productId },
                    data: { rulesJson: rules },
                });
                // Invalider le cache
                await this.cache.delSimple(`product_rules:${productId}`);
                this.logger.log(`Created zone ${zoneId} for product ${productId}`);
                return newZone;
            }
            catch (error) {
                this.logger.error(`Error creating zone for product ${productId}:`, error);
                throw error;
            }
        }
        /**
         * Met à jour une zone existante
         */
        async updateZone(productId, zoneId, updates) {
            try {
                const product = await this.prisma.product.findUnique({
                    where: { id: productId },
                    select: { rulesJson: true },
                });
                if (!product) {
                    throw new Error(`Product ${productId} not found`);
                }
                const rules = product.rulesJson || { zones: [] };
                const zoneIndex = rules.zones.findIndex(z => z.id === zoneId);
                if (zoneIndex === -1) {
                    throw new Error(`Zone ${zoneId} not found`);
                }
                // Mettre à jour la zone
                rules.zones[zoneIndex] = {
                    ...rules.zones[zoneIndex],
                    ...updates,
                    id: zoneId, // Préserver l'ID
                };
                // Sauvegarder les règles mises à jour
                await this.prisma.product.update({
                    where: { id: productId },
                    data: { rulesJson: rules },
                });
                // Invalider le cache
                await this.cache.delSimple(`product_rules:${productId}`);
                this.logger.log(`Updated zone ${zoneId} for product ${productId}`);
                return rules.zones[zoneIndex];
            }
            catch (error) {
                this.logger.error(`Error updating zone ${zoneId} for product ${productId}:`, error);
                throw error;
            }
        }
        /**
         * Supprime une zone
         */
        async deleteZone(productId, zoneId) {
            try {
                const product = await this.prisma.product.findUnique({
                    where: { id: productId },
                    select: { rulesJson: true },
                });
                if (!product) {
                    throw new Error(`Product ${productId} not found`);
                }
                const rules = product.rulesJson || { zones: [] };
                const zoneIndex = rules.zones.findIndex(z => z.id === zoneId);
                if (zoneIndex === -1) {
                    throw new Error(`Zone ${zoneId} not found`);
                }
                // Supprimer la zone
                rules.zones.splice(zoneIndex, 1);
                // Sauvegarder les règles mises à jour
                await this.prisma.product.update({
                    where: { id: productId },
                    data: { rulesJson: rules },
                });
                // Invalider le cache
                await this.cache.delSimple(`product_rules:${productId}`);
                this.logger.log(`Deleted zone ${zoneId} for product ${productId}`);
            }
            catch (error) {
                this.logger.error(`Error deleting zone ${zoneId} for product ${productId}:`, error);
                throw error;
            }
        }
        /**
         * Duplique une zone existante
         */
        async duplicateZone(productId, zoneId) {
            try {
                const product = await this.prisma.product.findUnique({
                    where: { id: productId },
                    select: { rulesJson: true },
                });
                if (!product) {
                    throw new Error(`Product ${productId} not found`);
                }
                const rules = product.rulesJson || { zones: [] };
                const originalZone = rules.zones.find(z => z.id === zoneId);
                if (!originalZone) {
                    throw new Error(`Zone ${zoneId} not found`);
                }
                // Créer une copie avec un nouvel ID
                const newZoneId = `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const duplicatedZone = {
                    ...originalZone,
                    id: newZoneId,
                    label: `${originalZone.label} (Copie)`,
                    x: originalZone.x + 20, // Décaler légèrement
                    y: originalZone.y + 20,
                };
                rules.zones.push(duplicatedZone);
                // Sauvegarder les règles mises à jour
                await this.prisma.product.update({
                    where: { id: productId },
                    data: { rulesJson: rules },
                });
                // Invalider le cache
                await this.cache.delSimple(`product_rules:${productId}`);
                this.logger.log(`Duplicated zone ${zoneId} to ${newZoneId} for product ${productId}`);
                return duplicatedZone;
            }
            catch (error) {
                this.logger.error(`Error duplicating zone ${zoneId} for product ${productId}:`, error);
                throw error;
            }
        }
        /**
         * Obtient toutes les zones d'un produit
         */
        async getZones(productId) {
            try {
                const product = await this.prisma.product.findUnique({
                    where: { id: productId },
                    select: { rulesJson: true },
                });
                if (!product || !product.rulesJson) {
                    return [];
                }
                const rules = product.rulesJson;
                return rules.zones || [];
            }
            catch (error) {
                this.logger.error(`Error getting zones for product ${productId}:`, error);
                throw error;
            }
        }
        /**
         * Obtient une zone spécifique
         */
        async getZone(productId, zoneId) {
            try {
                const zones = await this.getZones(productId);
                return zones.find(z => z.id === zoneId) || null;
            }
            catch (error) {
                this.logger.error(`Error getting zone ${zoneId} for product ${productId}:`, error);
                throw error;
            }
        }
        /**
         * Réorganise l'ordre des zones
         */
        async reorderZones(productId, zoneIds) {
            try {
                const product = await this.prisma.product.findUnique({
                    where: { id: productId },
                    select: { rulesJson: true },
                });
                if (!product) {
                    throw new Error(`Product ${productId} not found`);
                }
                const rules = product.rulesJson || { zones: [] };
                // Réorganiser les zones selon l'ordre fourni
                const reorderedZones = [];
                for (const zoneId of zoneIds) {
                    const zone = rules.zones.find(z => z.id === zoneId);
                    if (zone) {
                        reorderedZones.push(zone);
                    }
                }
                // Ajouter les zones non spécifiées à la fin
                for (const zone of rules.zones) {
                    if (!zoneIds.includes(zone.id)) {
                        reorderedZones.push(zone);
                    }
                }
                rules.zones = reorderedZones;
                // Sauvegarder les règles mises à jour
                await this.prisma.product.update({
                    where: { id: productId },
                    data: { rulesJson: rules },
                });
                // Invalider le cache
                await this.cache.delSimple(`product_rules:${productId}`);
                this.logger.log(`Reordered zones for product ${productId}`);
                return reorderedZones;
            }
            catch (error) {
                this.logger.error(`Error reordering zones for product ${productId}:`, error);
                throw error;
            }
        }
        /**
         * Valide les coordonnées d'une zone
         */
        validateZoneCoordinates(zone, canvasWidth, canvasHeight) {
            const errors = [];
            const warnings = [];
            // Vérifier les coordonnées
            if (zone.x !== undefined && (zone.x < 0 || zone.x >= canvasWidth)) {
                errors.push(`Position X (${zone.x}) en dehors des limites du canvas (0-${canvasWidth})`);
            }
            if (zone.y !== undefined && (zone.y < 0 || zone.y >= canvasHeight)) {
                errors.push(`Position Y (${zone.y}) en dehors des limites du canvas (0-${canvasHeight})`);
            }
            // Vérifier les dimensions
            if (zone.width !== undefined && zone.width <= 0) {
                errors.push('La largeur doit être positive');
            }
            if (zone.height !== undefined && zone.height <= 0) {
                errors.push('La hauteur doit être positive');
            }
            // Vérifier que la zone ne dépasse pas les limites
            if (zone.x !== undefined && zone.width !== undefined && zone.x + zone.width > canvasWidth) {
                errors.push('La zone dépasse la largeur du canvas');
            }
            if (zone.y !== undefined && zone.height !== undefined && zone.y + zone.height > canvasHeight) {
                errors.push('La zone dépasse la hauteur du canvas');
            }
            // Vérifier la taille minimale
            if (zone.width !== undefined && zone.width < 50) {
                warnings.push('La largeur est très petite (minimum recommandé: 50px)');
            }
            if (zone.height !== undefined && zone.height < 50) {
                warnings.push('La hauteur est très petite (minimum recommandé: 50px)');
            }
            return {
                isValid: errors.length === 0,
                errors,
                warnings,
            };
        }
        /**
         * Détecte les chevauchements entre zones
         */
        detectZoneOverlaps(zones) {
            const overlaps = [];
            for (let i = 0; i < zones.length; i++) {
                for (let j = i + 1; j < zones.length; j++) {
                    const zone1 = zones[i];
                    const zone2 = zones[j];
                    const overlap = this.calculateOverlap(zone1, zone2);
                    if (overlap.area > 0) {
                        const zone1Area = zone1.width * zone1.height;
                        const zone2Area = zone2.width * zone2.height;
                        const maxArea = Math.max(zone1Area, zone2Area);
                        overlaps.push({
                            zone1: zone1.id,
                            zone2: zone2.id,
                            overlapArea: overlap.area,
                            overlapPercentage: (overlap.area / maxArea) * 100,
                        });
                    }
                }
            }
            return overlaps;
        }
        /**
         * Calcule la zone de chevauchement entre deux zones
         */
        calculateOverlap(zone1, zone2) {
            const left = Math.max(zone1.x, zone2.x);
            const right = Math.min(zone1.x + zone1.width, zone2.x + zone2.width);
            const top = Math.max(zone1.y, zone2.y);
            const bottom = Math.min(zone1.y + zone1.height, zone2.y + zone2.height);
            if (left < right && top < bottom) {
                const width = right - left;
                const height = bottom - top;
                return {
                    area: width * height,
                    x: left,
                    y: top,
                    width,
                    height,
                };
            }
            return { area: 0, x: 0, y: 0, width: 0, height: 0 };
        }
        /**
         * Obtient les statistiques d'usage des zones
         */
        async getZoneUsageStats(productId, period = 'week') {
            const cacheKey = `zone_usage_stats:${productId}:${period}`;
            const cached = await this.cache.getSimple(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            try {
                // Calculer la période
                const now = new Date();
                const startDate = new Date();
                switch (period) {
                    case 'day':
                        startDate.setDate(now.getDate() - 1);
                        break;
                    case 'week':
                        startDate.setDate(now.getDate() - 7);
                        break;
                    case 'month':
                        startDate.setMonth(now.getMonth() - 1);
                        break;
                }
                // Récupérer les designs avec options pour cette période
                const designs = await this.prisma.design.findMany({
                    where: {
                        productId,
                        createdAt: {
                            gte: startDate,
                            lte: now,
                        },
                    },
                    select: {
                        options: true,
                        status: true,
                    },
                });
                const zones = await this.getZones(productId);
                const stats = {};
                // Initialiser les stats pour chaque zone
                for (const zone of zones) {
                    stats[zone.id] = {
                        usageCount: 0,
                        successRate: 0,
                        averagePrice: 0,
                        popularOptions: [],
                    };
                }
                // Analyser l'usage des zones
                for (const design of designs) {
                    const options = design.options;
                    if (!options.zones)
                        continue;
                    for (const [zoneId, zoneOptions] of Object.entries(options.zones)) {
                        if (stats[zoneId]) {
                            stats[zoneId].usageCount++;
                            if (design.status === 'COMPLETED') {
                                stats[zoneId].successRate++;
                            }
                            // Analyser les options populaires
                            for (const [optionKey, optionValue] of Object.entries(zoneOptions)) {
                                const existingOption = stats[zoneId].popularOptions.find((opt) => opt.option === optionKey);
                                if (existingOption) {
                                    existingOption.count++;
                                }
                                else {
                                    stats[zoneId].popularOptions.push({
                                        option: optionKey,
                                        count: 1,
                                    });
                                }
                            }
                        }
                    }
                }
                // Calculer les taux de succès
                for (const zoneId of Object.keys(stats)) {
                    if (stats[zoneId].usageCount > 0) {
                        stats[zoneId].successRate = (stats[zoneId].successRate / stats[zoneId].usageCount) * 100;
                    }
                    // Trier les options populaires
                    stats[zoneId].popularOptions.sort((a, b) => b.count - a.count);
                    stats[zoneId].popularOptions = stats[zoneId].popularOptions.slice(0, 5); // Top 5
                }
                // Mettre en cache pour 30 minutes
                await this.cache.setSimple(cacheKey, JSON.stringify(stats), 1800);
                return stats;
            }
            catch (error) {
                this.logger.error(`Error getting zone usage stats for ${productId}:`, error);
                throw error;
            }
        }
        /**
         * Génère des suggestions d'amélioration pour les zones
         */
        async getZoneImprovementSuggestions(productId) {
            try {
                const zones = await this.getZones(productId);
                const usageStats = await this.getZoneUsageStats(productId, 'month');
                const suggestions = [];
                for (const zone of zones) {
                    const stats = usageStats[zone.id];
                    // Zone peu utilisée
                    if (stats && stats.usageCount < 5) {
                        suggestions.push({
                            zoneId: zone.id,
                            zoneLabel: zone.label,
                            suggestion: 'Considérez repositionner ou redimensionner cette zone pour améliorer la visibilité',
                            priority: 'medium',
                            impact: 'Augmentation potentielle de l\'engagement utilisateur',
                        });
                    }
                    // Zone avec faible taux de succès
                    if (stats && stats.successRate < 70) {
                        suggestions.push({
                            zoneId: zone.id,
                            zoneLabel: zone.label,
                            suggestion: 'Simplifiez les contraintes ou ajoutez des exemples pour guider les utilisateurs',
                            priority: 'high',
                            impact: 'Amélioration du taux de conversion',
                        });
                    }
                    // Zone avec contraintes trop strictes
                    if (zone.constraints?.maxChars && zone.constraints.maxChars < 10) {
                        suggestions.push({
                            zoneId: zone.id,
                            zoneLabel: zone.label,
                            suggestion: 'Augmentez la limite de caractères pour permettre plus de créativité',
                            priority: 'low',
                            impact: 'Meilleure expérience utilisateur',
                        });
                    }
                    // Zone mal positionnée
                    if (zone.x < 50 || zone.y < 50) {
                        suggestions.push({
                            zoneId: zone.id,
                            zoneLabel: zone.label,
                            suggestion: 'Déplacez la zone vers le centre pour améliorer la visibilité',
                            priority: 'low',
                            impact: 'Meilleure ergonomie',
                        });
                    }
                }
                return suggestions;
            }
            catch (error) {
                this.logger.error(`Error getting zone improvement suggestions for ${productId}:`, error);
                throw error;
            }
        }
    };
    __setFunctionName(_classThis, "ZonesService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ZonesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ZonesService = _classThis;
})();
exports.ZonesService = ZonesService;
