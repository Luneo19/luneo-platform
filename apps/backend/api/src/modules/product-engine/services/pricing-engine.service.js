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
exports.PricingEngine = void 0;
const common_1 = require("@nestjs/common");
let PricingEngine = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PricingEngine = _classThis = class {
        constructor(prisma, cache) {
            this.prisma = prisma;
            this.cache = cache;
            this.logger = new common_1.Logger(PricingEngine.name);
        }
        /**
         * Calcule le prix total d'un design personnalisé
         */
        async calculatePrice(context) {
            try {
                const { baseProduct, options, rules, brandTier = 'professional', quantity } = context;
                // Prix de base
                const basePrice = baseProduct.price;
                // Prix des zones
                const zonePrice = this.calculateZonePrice(options, rules);
                // Prix des matériaux
                const materialPrice = this.calculateMaterialPrice(options, rules);
                // Prix des finitions
                const finishPrice = this.calculateFinishPrice(options, rules);
                // Prix unitaire total (avant quantité)
                const unitPrice = basePrice + zonePrice + materialPrice + finishPrice;
                // Calcul des remises de quantité
                const quantityDiscount = this.calculateQuantityDiscount(unitPrice, quantity, rules.pricing?.quantityDiscounts || []);
                // Calcul du prix de quantité
                const quantityPrice = this.calculateQuantityPrice(unitPrice, quantity, rules.pricing?.bulkPricing || []);
                // Application des remises
                const discount = quantityDiscount;
                const finalUnitPrice = quantityPrice;
                const totalPrice = finalUnitPrice * quantity;
                const breakdown = {
                    base: basePrice,
                    zones: zonePrice,
                    material: materialPrice,
                    finish: finishPrice,
                    quantity: quantityPrice - unitPrice,
                    discount: discount,
                    unit: finalUnitPrice,
                    total: totalPrice,
                };
                // Log pour audit
                this.logger.debug(`Price calculation for product ${baseProduct.id}:`, {
                    basePrice,
                    zonePrice,
                    materialPrice,
                    finishPrice,
                    quantity,
                    totalPrice,
                    brandTier,
                });
                return {
                    basePrice,
                    zonePrice,
                    materialPrice,
                    finishPrice,
                    quantityPrice: finalUnitPrice,
                    discount,
                    totalPrice,
                    breakdown,
                };
            }
            catch (error) {
                this.logger.error('Error calculating price:', error);
                throw error;
            }
        }
        /**
         * Calcule le prix des zones personnalisées
         */
        calculateZonePrice(options, rules) {
            if (!options.zones || !rules.zones)
                return 0;
            let totalZonePrice = 0;
            for (const [zoneId, zoneOptions] of Object.entries(options.zones)) {
                const zone = rules.zones.find(z => z.id === zoneId);
                if (!zone)
                    continue;
                // Prix de base de la zone
                const zoneBasePrice = zone.priceDeltaCents || 0;
                // Prix selon le type de zone
                let zoneTypePrice = 0;
                switch (zone.type) {
                    case 'image':
                        zoneTypePrice = this.calculateImageZonePrice(zoneOptions);
                        break;
                    case 'text':
                        zoneTypePrice = this.calculateTextZonePrice(zoneOptions);
                        break;
                    case 'color':
                        zoneTypePrice = this.calculateColorZonePrice(zoneOptions);
                        break;
                    case 'select':
                        zoneTypePrice = this.calculateSelectZonePrice(zoneOptions);
                        break;
                }
                totalZonePrice += zoneBasePrice + zoneTypePrice;
            }
            return totalZonePrice;
        }
        /**
         * Calcule le prix d'une zone image
         */
        calculateImageZonePrice(options) {
            let price = 0;
            // Prix basé sur la complexité de l'image
            if (options.complexity) {
                switch (options.complexity) {
                    case 'simple':
                        price += 50; // 0.50€
                        break;
                    case 'medium':
                        price += 100; // 1.00€
                        break;
                    case 'complex':
                        price += 200; // 2.00€
                        break;
                }
            }
            // Prix basé sur la résolution
            if (options.width && options.height) {
                const megapixels = (options.width * options.height) / 1000000;
                if (megapixels > 10) {
                    price += 50; // Prix supplémentaire pour haute résolution
                }
            }
            // Prix pour effets spéciaux
            if (options.effects) {
                price += options.effects.length * 25; // 0.25€ par effet
            }
            return price;
        }
        /**
         * Calcule le prix d'une zone texte
         */
        calculateTextZonePrice(options) {
            let price = 0;
            // Prix basé sur la longueur du texte
            if (options.text && options.text.length > 10) {
                price += Math.ceil(options.text.length / 10) * 25; // 0.25€ par 10 caractères
            }
            // Prix pour polices premium
            if (options.font && this.isPremiumFont(options.font)) {
                price += 75; // 0.75€ pour police premium
            }
            // Prix pour effets de texte
            if (options.effects) {
                price += options.effects.length * 30; // 0.30€ par effet
            }
            return price;
        }
        /**
         * Calcule le prix d'une zone couleur
         */
        calculateColorZonePrice(options) {
            let price = 0;
            // Prix pour couleurs métalliques ou spéciales
            if (options.color && this.isSpecialColor(options.color)) {
                price += 100; // 1.00€ pour couleur spéciale
            }
            // Prix pour dégradés
            if (options.gradient) {
                price += 50; // 0.50€ pour dégradé
            }
            return price;
        }
        /**
         * Calcule le prix d'une zone de sélection
         */
        calculateSelectZonePrice(options) {
            let price = 0;
            // Prix pour options premium
            if (options.value && this.isPremiumOption(options.value)) {
                price += 75; // 0.75€ pour option premium
            }
            return price;
        }
        /**
         * Calcule le prix des matériaux
         */
        calculateMaterialPrice(options, rules) {
            if (!options.materials || !rules.pricing?.materialPricing)
                return 0;
            let totalMaterialPrice = 0;
            for (const [material, value] of Object.entries(options.materials)) {
                const materialPrice = rules.pricing.materialPricing[material] || 0;
                totalMaterialPrice += materialPrice * (typeof value === 'number' ? value : 1);
            }
            return totalMaterialPrice;
        }
        /**
         * Calcule le prix des finitions
         */
        calculateFinishPrice(options, rules) {
            if (!options.finishes || !rules.pricing?.finishPricing)
                return 0;
            let totalFinishPrice = 0;
            for (const [finish, value] of Object.entries(options.finishes)) {
                const finishPrice = rules.pricing.finishPricing[finish] || 0;
                totalFinishPrice += finishPrice * (typeof value === 'number' ? value : 1);
            }
            return totalFinishPrice;
        }
        /**
         * Calcule les remises de quantité
         */
        calculateQuantityDiscount(unitPrice, quantity, discounts) {
            if (!discounts.length)
                return 0;
            // Trier les remises par quantité décroissante
            const sortedDiscounts = discounts.sort((a, b) => b.minQuantity - a.minQuantity);
            // Trouver la remise applicable
            for (const discount of sortedDiscounts) {
                if (quantity >= discount.minQuantity) {
                    return (unitPrice * discount.discountPercent) / 100;
                }
            }
            return 0;
        }
        /**
         * Calcule le prix selon la quantité (pricing en volume)
         */
        calculateQuantityPrice(unitPrice, quantity, bulkPricing) {
            if (!bulkPricing.length)
                return unitPrice;
            // Trier par quantité décroissante
            const sortedBulkPricing = bulkPricing.sort((a, b) => b.minQuantity - a.minQuantity);
            // Trouver le prix en volume applicable
            for (const pricing of sortedBulkPricing) {
                if (quantity >= pricing.minQuantity) {
                    return pricing.pricePerUnit;
                }
            }
            return unitPrice;
        }
        /**
         * Vérifie si une police est premium
         */
        isPremiumFont(font) {
            const premiumFonts = [
                'helvetica-neue',
                'futura',
                'bodoni',
                'garamond',
                'times-new-roman',
            ];
            return premiumFonts.includes(font.toLowerCase());
        }
        /**
         * Vérifie si une couleur est spéciale
         */
        isSpecialColor(color) {
            const specialColors = [
                'gold',
                'silver',
                'rose-gold',
                'platinum',
                'copper',
                'bronze',
            ];
            return specialColors.includes(color.toLowerCase());
        }
        /**
         * Vérifie si une option est premium
         */
        isPremiumOption(option) {
            const premiumOptions = [
                'premium',
                'deluxe',
                'luxury',
                'professional',
                'enterprise',
            ];
            return premiumOptions.some(premium => option.toLowerCase().includes(premium));
        }
        /**
         * Obtient les suggestions de prix pour optimiser les ventes
         */
        async getPricingSuggestions(productId) {
            const cacheKey = `pricing_suggestions:${productId}`;
            const cached = await this.cache.getSimple(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            try {
                // Analyser les ventes récentes
                const recentSales = await this.prisma.order.findMany({
                    where: {
                        productId,
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours
                        },
                    },
                    select: {
                        totalCents: true,
                        createdAt: true,
                    },
                });
                // Calculer les statistiques de prix
                const prices = recentSales.map(sale => sale.totalCents / 100);
                const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                // Analyse concurrentielle (simulation)
                const competitiveAnalysis = {
                    marketAverage: avgPrice * 1.1, // +10% vs moyenne interne
                    priceRange: {
                        min: minPrice * 0.9,
                        max: maxPrice * 1.1,
                    },
                    recommendations: [
                        {
                            strategy: 'competitive',
                            price: avgPrice * 0.95,
                            reasoning: 'Prix compétitif pour gagner des parts de marché',
                        },
                        {
                            strategy: 'premium',
                            price: avgPrice * 1.15,
                            reasoning: 'Positionnement premium pour maximiser les marges',
                        },
                        {
                            strategy: 'volume',
                            price: avgPrice * 0.85,
                            reasoning: 'Prix attractif pour stimuler les ventes',
                        },
                    ],
                };
                // Analyse des marges
                const marginAnalysis = {
                    currentMargin: 0.35, // 35% (simulation)
                    targetMargin: 0.40, // 40%
                    costBreakdown: {
                        materials: 0.40,
                        labor: 0.15,
                        overhead: 0.10,
                        profit: 0.35,
                    },
                };
                // Historique des prix (simulation)
                const priceHistory = Array.from({ length: 12 }, (_, i) => ({
                    month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000),
                    price: avgPrice * (1 + (Math.random() - 0.5) * 0.1),
                    sales: Math.floor(Math.random() * 50) + 20,
                }));
                const suggestions = {
                    recommendedBasePrice: avgPrice,
                    competitiveAnalysis,
                    marginAnalysis,
                    priceHistory,
                };
                // Mettre en cache pour 1 heure
                await this.cache.setSimple(cacheKey, JSON.stringify(suggestions), 3600);
                return suggestions;
            }
            catch (error) {
                this.logger.error(`Error getting pricing suggestions for ${productId}:`, error);
                throw error;
            }
        }
        /**
         * Calcule le prix de revient d'un produit
         */
        async calculateCostPrice(productId, options) {
            try {
                // Récupérer les coûts de base du produit
                const product = await this.prisma.product.findUnique({
                    where: { id: productId },
                    select: {
                        baseCostCents: true,
                        laborCostCents: true,
                        overheadCostCents: true,
                    },
                });
                if (!product) {
                    throw new Error(`Product ${productId} not found`);
                }
                // Coût de base
                const baseCost = product.baseCostCents || 0;
                // Coût des matériaux personnalisés
                const materialCost = this.calculateCustomMaterialCost(options);
                // Coût de la main d'œuvre
                const laborCost = product.laborCostCents || 0;
                // Coût des frais généraux
                const overheadCost = product.overheadCostCents || 0;
                // Coût total
                const totalCost = baseCost + materialCost + laborCost + overheadCost;
                // Marge (simulation basée sur les options)
                const margin = this.calculateMargin(totalCost, options);
                return {
                    materialCost,
                    laborCost,
                    overheadCost,
                    totalCost,
                    margin,
                };
            }
            catch (error) {
                this.logger.error(`Error calculating cost price for ${productId}:`, error);
                throw error;
            }
        }
        /**
         * Calcule le coût des matériaux personnalisés
         */
        calculateCustomMaterialCost(options) {
            let cost = 0;
            // Coût basé sur la complexité des zones
            if (options.zones) {
                for (const [zoneId, zoneOptions] of Object.entries(options.zones)) {
                    // Coût pour zones complexes
                    if (zoneOptions.complexity === 'complex') {
                        cost += 150; // 1.50€
                    }
                    else if (zoneOptions.complexity === 'medium') {
                        cost += 75; // 0.75€
                    }
                }
            }
            return cost;
        }
        /**
         * Calcule la marge recommandée
         */
        calculateMargin(cost, options) {
            let margin = 0.35; // Marge de base 35%
            // Ajuster la marge selon la complexité
            if (options.zones) {
                const complexZones = Object.values(options.zones).filter((zone) => zone.complexity === 'complex').length;
                if (complexZones > 2) {
                    margin += 0.05; // +5% pour designs très complexes
                }
            }
            return Math.min(margin, 0.60); // Marge max 60%
        }
    };
    __setFunctionName(_classThis, "PricingEngine");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PricingEngine = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PricingEngine = _classThis;
})();
exports.PricingEngine = PricingEngine;
