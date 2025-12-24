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
exports.ProductEngineController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@/modules/auth/guards/jwt-auth.guard");
let ProductEngineController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Product Engine'), (0, common_1.Controller)('product-engine'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getProductRules_decorators;
    let _updateProductRules_decorators;
    let _getRulesUsageStats_decorators;
    let _getZones_decorators;
    let _getZone_decorators;
    let _createZone_decorators;
    let _updateZone_decorators;
    let _deleteZone_decorators;
    let _duplicateZone_decorators;
    let _reorderZones_decorators;
    let _getZoneUsageStats_decorators;
    let _getZoneImprovementSuggestions_decorators;
    let _validateDesign_decorators;
    let _validateZoneCoordinates_decorators;
    let _detectZoneOverlaps_decorators;
    let _calculatePrice_decorators;
    let _getPricingSuggestions_decorators;
    let _calculateCostPrice_decorators;
    let _getProductPerformance_decorators;
    let _getOptimizationRecommendations_decorators;
    let _getZonePresets_decorators;
    let _applyZonePreset_decorators;
    var ProductEngineController = _classThis = class {
        constructor(productRulesService, zonesService, pricingEngine, validationEngine) {
            this.productRulesService = (__runInitializers(this, _instanceExtraInitializers), productRulesService);
            this.zonesService = zonesService;
            this.pricingEngine = pricingEngine;
            this.validationEngine = validationEngine;
        }
        // ========================================
        // PRODUCT RULES
        // ========================================
        async getProductRules(productId) {
            return this.productRulesService.getProductRules(productId);
        }
        async updateProductRules(productId, rules) {
            return this.productRulesService.updateProductRules(productId, rules);
        }
        async getRulesUsageStats(productId, period = 'week') {
            return this.productRulesService.getRulesUsageStats(productId, period);
        }
        // ========================================
        // ZONES MANAGEMENT
        // ========================================
        async getZones(productId) {
            return this.zonesService.getZones(productId);
        }
        async getZone(productId, zoneId) {
            return this.zonesService.getZone(productId, zoneId);
        }
        async createZone(productId, zone) {
            return this.zonesService.createZone(productId, zone);
        }
        async updateZone(productId, zoneId, updates) {
            return this.zonesService.updateZone(productId, zoneId, updates);
        }
        async deleteZone(productId, zoneId) {
            return this.zonesService.deleteZone(productId, zoneId);
        }
        async duplicateZone(productId, zoneId) {
            return this.zonesService.duplicateZone(productId, zoneId);
        }
        async reorderZones(productId, zoneIds) {
            return this.zonesService.reorderZones(productId, zoneIds);
        }
        async getZoneUsageStats(productId, period = 'week') {
            return this.zonesService.getZoneUsageStats(productId, period);
        }
        async getZoneImprovementSuggestions(productId) {
            return this.zonesService.getZoneImprovementSuggestions(productId);
        }
        // ========================================
        // VALIDATION
        // ========================================
        async validateDesign(context) {
            return this.validationEngine.validateDesign(context);
        }
        async validateZoneCoordinates(body) {
            return this.zonesService.validateZoneCoordinates(body.zone, body.canvasWidth, body.canvasHeight);
        }
        async detectZoneOverlaps(zones) {
            return this.zonesService.detectZoneOverlaps(zones);
        }
        // ========================================
        // PRICING
        // ========================================
        async calculatePrice(context) {
            return this.pricingEngine.calculatePrice(context);
        }
        async getPricingSuggestions(productId) {
            return this.pricingEngine.getPricingSuggestions(productId);
        }
        async calculateCostPrice(productId, options) {
            return this.pricingEngine.calculateCostPrice(productId, options);
        }
        // ========================================
        // ANALYTICS & INSIGHTS
        // ========================================
        async getProductPerformance(productId, period = 'month') {
            // Combiner les statistiques des règles et des zones
            const [rulesStats, zoneStats] = await Promise.all([
                this.productRulesService.getRulesUsageStats(productId, period),
                this.zonesService.getZoneUsageStats(productId, period),
            ]);
            return {
                rules: rulesStats,
                zones: zoneStats,
                period,
                generatedAt: new Date(),
            };
        }
        async getOptimizationRecommendations(productId) {
            const [zoneSuggestions, pricingSuggestions] = await Promise.all([
                this.zonesService.getZoneImprovementSuggestions(productId),
                this.pricingEngine.getPricingSuggestions(productId),
            ]);
            return {
                zones: zoneSuggestions,
                pricing: pricingSuggestions,
                generatedAt: new Date(),
            };
        }
        // ========================================
        // TEMPLATES & PRESETS
        // ========================================
        async getZonePresets() {
            return {
                text: [
                    {
                        id: 'text-basic',
                        name: 'Texte basique',
                        type: 'text',
                        constraints: {
                            maxChars: 50,
                            allowedFonts: ['arial', 'helvetica', 'times'],
                        },
                    },
                    {
                        id: 'text-premium',
                        name: 'Texte premium',
                        type: 'text',
                        constraints: {
                            maxChars: 100,
                            allowedFonts: ['helvetica-neue', 'futura', 'bodoni'],
                        },
                        priceDeltaCents: 50,
                    },
                ],
                image: [
                    {
                        id: 'image-standard',
                        name: 'Image standard',
                        type: 'image',
                        allowedMime: ['image/png', 'image/jpeg'],
                        maxResolution: { w: 2000, h: 2000 },
                    },
                    {
                        id: 'image-hd',
                        name: 'Image HD',
                        type: 'image',
                        allowedMime: ['image/png', 'image/jpeg'],
                        maxResolution: { w: 4000, h: 4000 },
                        priceDeltaCents: 100,
                    },
                ],
                color: [
                    {
                        id: 'color-basic',
                        name: 'Couleur basique',
                        type: 'color',
                        constraints: {
                            allowedColors: ['red', 'blue', 'green', 'black', 'white'],
                        },
                    },
                    {
                        id: 'color-premium',
                        name: 'Couleur premium',
                        type: 'color',
                        constraints: {
                            allowedColors: ['gold', 'silver', 'rose-gold', 'platinum'],
                        },
                        priceDeltaCents: 150,
                    },
                ],
                select: [
                    {
                        id: 'select-material',
                        name: 'Sélection matériau',
                        type: 'select',
                        metadata: {
                            options: ['cotton', 'polyester', 'silk', 'linen'],
                        },
                    },
                    {
                        id: 'select-finish',
                        name: 'Sélection finition',
                        type: 'select',
                        metadata: {
                            options: ['matte', 'glossy', 'embossed', 'engraved'],
                        },
                        priceDeltaCents: 75,
                    },
                ],
            };
        }
        async applyZonePreset(body) {
            const presets = await this.getZonePresets();
            // Trouver le preset
            let preset = null;
            for (const category of Object.values(presets)) {
                const found = category.find((p) => p.id === body.presetId);
                if (found) {
                    preset = found;
                    break;
                }
            }
            if (!preset) {
                throw new Error(`Preset ${body.presetId} not found`);
            }
            // Créer la zone avec le preset
            const zoneData = {
                label: preset.name,
                type: preset.type,
                x: body.position?.x || 100,
                y: body.position?.y || 100,
                width: 200,
                height: 100,
                ...preset,
            };
            return this.zonesService.createZone(body.productId, zoneData);
        }
    };
    __setFunctionName(_classThis, "ProductEngineController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getProductRules_decorators = [(0, common_1.Get)('products/:productId/rules'), (0, swagger_1.ApiOperation)({ summary: 'Récupère les règles d\'un produit' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Règles du produit récupérées avec succès' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Produit non trouvé' })];
        _updateProductRules_decorators = [(0, common_1.Put)('products/:productId/rules'), (0, swagger_1.ApiOperation)({ summary: 'Met à jour les règles d\'un produit' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Règles mises à jour avec succès' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Règles invalides' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Produit non trouvé' })];
        _getRulesUsageStats_decorators = [(0, common_1.Get)('products/:productId/rules/usage-stats'), (0, swagger_1.ApiOperation)({ summary: 'Obtient les statistiques d\'usage des règles' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistiques récupérées avec succès' })];
        _getZones_decorators = [(0, common_1.Get)('products/:productId/zones'), (0, swagger_1.ApiOperation)({ summary: 'Récupère toutes les zones d\'un produit' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Zones récupérées avec succès' })];
        _getZone_decorators = [(0, common_1.Get)('products/:productId/zones/:zoneId'), (0, swagger_1.ApiOperation)({ summary: 'Récupère une zone spécifique' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Zone récupérée avec succès' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Zone non trouvée' })];
        _createZone_decorators = [(0, common_1.Post)('products/:productId/zones'), (0, swagger_1.ApiOperation)({ summary: 'Crée une nouvelle zone' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Zone créée avec succès' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Données de zone invalides' })];
        _updateZone_decorators = [(0, common_1.Put)('products/:productId/zones/:zoneId'), (0, swagger_1.ApiOperation)({ summary: 'Met à jour une zone existante' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Zone mise à jour avec succès' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Données de zone invalides' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Zone non trouvée' })];
        _deleteZone_decorators = [(0, common_1.Delete)('products/:productId/zones/:zoneId'), (0, swagger_1.ApiOperation)({ summary: 'Supprime une zone' }), (0, swagger_1.ApiResponse)({ status: 204, description: 'Zone supprimée avec succès' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Zone non trouvée' }), (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT)];
        _duplicateZone_decorators = [(0, common_1.Post)('products/:productId/zones/:zoneId/duplicate'), (0, swagger_1.ApiOperation)({ summary: 'Duplique une zone existante' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Zone dupliquée avec succès' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Zone non trouvée' })];
        _reorderZones_decorators = [(0, common_1.Put)('products/:productId/zones/reorder'), (0, swagger_1.ApiOperation)({ summary: 'Réorganise l\'ordre des zones' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Zones réorganisées avec succès' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Ordre invalide' })];
        _getZoneUsageStats_decorators = [(0, common_1.Get)('products/:productId/zones/usage-stats'), (0, swagger_1.ApiOperation)({ summary: 'Obtient les statistiques d\'usage des zones' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistiques récupérées avec succès' })];
        _getZoneImprovementSuggestions_decorators = [(0, common_1.Get)('products/:productId/zones/improvement-suggestions'), (0, swagger_1.ApiOperation)({ summary: 'Obtient des suggestions d\'amélioration pour les zones' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Suggestions récupérées avec succès' })];
        _validateDesign_decorators = [(0, common_1.Post)('validate/design'), (0, swagger_1.ApiOperation)({ summary: 'Valide un design complet' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Design validé avec succès' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Design invalide' })];
        _validateZoneCoordinates_decorators = [(0, common_1.Post)('validate/coordinates'), (0, swagger_1.ApiOperation)({ summary: 'Valide les coordonnées d\'une zone' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Coordonnées validées avec succès' })];
        _detectZoneOverlaps_decorators = [(0, common_1.Post)('validate/overlaps'), (0, swagger_1.ApiOperation)({ summary: 'Détecte les chevauchements entre zones' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Chevauchements détectés avec succès' })];
        _calculatePrice_decorators = [(0, common_1.Post)('pricing/calculate'), (0, swagger_1.ApiOperation)({ summary: 'Calcule le prix d\'un design personnalisé' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Prix calculé avec succès' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Données de pricing invalides' })];
        _getPricingSuggestions_decorators = [(0, common_1.Get)('pricing/products/:productId/suggestions'), (0, swagger_1.ApiOperation)({ summary: 'Obtient des suggestions de prix pour un produit' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Suggestions récupérées avec succès' })];
        _calculateCostPrice_decorators = [(0, common_1.Post)('pricing/products/:productId/cost'), (0, swagger_1.ApiOperation)({ summary: 'Calcule le prix de revient d\'un produit' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Prix de revient calculé avec succès' })];
        _getProductPerformance_decorators = [(0, common_1.Get)('analytics/products/:productId/performance'), (0, swagger_1.ApiOperation)({ summary: 'Obtient les métriques de performance d\'un produit' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Métriques récupérées avec succès' })];
        _getOptimizationRecommendations_decorators = [(0, common_1.Get)('analytics/products/:productId/optimization'), (0, swagger_1.ApiOperation)({ summary: 'Obtient des recommandations d\'optimisation' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Recommandations récupérées avec succès' })];
        _getZonePresets_decorators = [(0, common_1.Get)('templates/zone-presets'), (0, swagger_1.ApiOperation)({ summary: 'Obtient les presets de zones disponibles' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Presets récupérés avec succès' })];
        _applyZonePreset_decorators = [(0, common_1.Post)('templates/apply-preset'), (0, swagger_1.ApiOperation)({ summary: 'Applique un preset de zone à un produit' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Preset appliqué avec succès' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Preset invalide' })];
        __esDecorate(_classThis, null, _getProductRules_decorators, { kind: "method", name: "getProductRules", static: false, private: false, access: { has: obj => "getProductRules" in obj, get: obj => obj.getProductRules }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateProductRules_decorators, { kind: "method", name: "updateProductRules", static: false, private: false, access: { has: obj => "updateProductRules" in obj, get: obj => obj.updateProductRules }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRulesUsageStats_decorators, { kind: "method", name: "getRulesUsageStats", static: false, private: false, access: { has: obj => "getRulesUsageStats" in obj, get: obj => obj.getRulesUsageStats }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getZones_decorators, { kind: "method", name: "getZones", static: false, private: false, access: { has: obj => "getZones" in obj, get: obj => obj.getZones }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getZone_decorators, { kind: "method", name: "getZone", static: false, private: false, access: { has: obj => "getZone" in obj, get: obj => obj.getZone }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createZone_decorators, { kind: "method", name: "createZone", static: false, private: false, access: { has: obj => "createZone" in obj, get: obj => obj.createZone }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateZone_decorators, { kind: "method", name: "updateZone", static: false, private: false, access: { has: obj => "updateZone" in obj, get: obj => obj.updateZone }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteZone_decorators, { kind: "method", name: "deleteZone", static: false, private: false, access: { has: obj => "deleteZone" in obj, get: obj => obj.deleteZone }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _duplicateZone_decorators, { kind: "method", name: "duplicateZone", static: false, private: false, access: { has: obj => "duplicateZone" in obj, get: obj => obj.duplicateZone }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _reorderZones_decorators, { kind: "method", name: "reorderZones", static: false, private: false, access: { has: obj => "reorderZones" in obj, get: obj => obj.reorderZones }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getZoneUsageStats_decorators, { kind: "method", name: "getZoneUsageStats", static: false, private: false, access: { has: obj => "getZoneUsageStats" in obj, get: obj => obj.getZoneUsageStats }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getZoneImprovementSuggestions_decorators, { kind: "method", name: "getZoneImprovementSuggestions", static: false, private: false, access: { has: obj => "getZoneImprovementSuggestions" in obj, get: obj => obj.getZoneImprovementSuggestions }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _validateDesign_decorators, { kind: "method", name: "validateDesign", static: false, private: false, access: { has: obj => "validateDesign" in obj, get: obj => obj.validateDesign }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _validateZoneCoordinates_decorators, { kind: "method", name: "validateZoneCoordinates", static: false, private: false, access: { has: obj => "validateZoneCoordinates" in obj, get: obj => obj.validateZoneCoordinates }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _detectZoneOverlaps_decorators, { kind: "method", name: "detectZoneOverlaps", static: false, private: false, access: { has: obj => "detectZoneOverlaps" in obj, get: obj => obj.detectZoneOverlaps }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _calculatePrice_decorators, { kind: "method", name: "calculatePrice", static: false, private: false, access: { has: obj => "calculatePrice" in obj, get: obj => obj.calculatePrice }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPricingSuggestions_decorators, { kind: "method", name: "getPricingSuggestions", static: false, private: false, access: { has: obj => "getPricingSuggestions" in obj, get: obj => obj.getPricingSuggestions }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _calculateCostPrice_decorators, { kind: "method", name: "calculateCostPrice", static: false, private: false, access: { has: obj => "calculateCostPrice" in obj, get: obj => obj.calculateCostPrice }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getProductPerformance_decorators, { kind: "method", name: "getProductPerformance", static: false, private: false, access: { has: obj => "getProductPerformance" in obj, get: obj => obj.getProductPerformance }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getOptimizationRecommendations_decorators, { kind: "method", name: "getOptimizationRecommendations", static: false, private: false, access: { has: obj => "getOptimizationRecommendations" in obj, get: obj => obj.getOptimizationRecommendations }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getZonePresets_decorators, { kind: "method", name: "getZonePresets", static: false, private: false, access: { has: obj => "getZonePresets" in obj, get: obj => obj.getZonePresets }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _applyZonePreset_decorators, { kind: "method", name: "applyZonePreset", static: false, private: false, access: { has: obj => "applyZonePreset" in obj, get: obj => obj.applyZonePreset }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ProductEngineController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ProductEngineController = _classThis;
})();
exports.ProductEngineController = ProductEngineController;
