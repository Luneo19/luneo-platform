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
exports.ABTestingService = void 0;
const common_1 = require("@nestjs/common");
let ABTestingService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ABTestingService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
            this.logger = new common_1.Logger(ABTestingService.name);
        }
        /**
         * Crée une expérience A/B
         */
        async createExperiment(experiment) {
            const exp = {
                id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...experiment,
                status: 'draft',
            };
            // TODO: Sauvegarder dans table Experiment
            this.logger.log(`Experiment created: ${exp.id} - ${exp.name}`);
            return exp;
        }
        /**
         * Démarre une expérience
         */
        async startExperiment(experimentId) {
            // TODO: Récupérer depuis table Experiment
            const experiment = {
                id: experimentId,
                status: 'running',
                startDate: new Date(),
            };
            this.logger.log(`Experiment started: ${experimentId}`);
            return experiment;
        }
        /**
         * Assigne un utilisateur à une variante
         */
        async assignVariant(userId, experimentId) {
            // Vérifier si déjà assigné
            const existing = await this.getAssignment(userId, experimentId);
            if (existing) {
                return existing.variantId;
            }
            // TODO: Récupérer expérience depuis table
            const experiment = {
                id: experimentId,
                variants: [
                    { id: 'control', name: 'Control', config: {}, weight: 50 },
                    { id: 'variant_a', name: 'Variant A', config: {}, weight: 50 },
                ],
            };
            // Assigner selon poids (hash userId pour consistance)
            const hash = this.hashUserId(userId, experimentId);
            const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
            let cumulative = 0;
            let selectedVariant = experiment.variants[0].id;
            for (const variant of experiment.variants) {
                cumulative += variant.weight;
                if (hash < (cumulative / totalWeight) * 100) {
                    selectedVariant = variant.id;
                    break;
                }
            }
            // Sauvegarder l'assignation
            await this.saveAssignment({
                userId,
                experimentId,
                variantId: selectedVariant,
                assignedAt: new Date(),
            });
            return selectedVariant;
        }
        /**
         * Récupère l'assignation d'un utilisateur
         */
        async getAssignment(userId, experimentId) {
            // TODO: Récupérer depuis table ExperimentAssignment
            return null;
        }
        /**
         * Enregistre une conversion
         */
        async recordConversion(userId, experimentId, conversionType, value) {
            const assignment = await this.getAssignment(userId, experimentId);
            if (!assignment) {
                return; // Utilisateur pas dans l'expérience
            }
            // TODO: Sauvegarder dans table Conversion
            this.logger.debug(`Conversion recorded: ${conversionType} for experiment ${experimentId}, variant ${assignment.variantId}`);
        }
        /**
         * Calcule les résultats d'une expérience
         */
        async getExperimentResults(experimentId) {
            // TODO: Calculer depuis table Conversion
            // Pour l'instant, simulation
            return [];
        }
        /**
         * Hash userId pour assignation consistante
         */
        hashUserId(userId, experimentId) {
            const str = `${userId}_${experimentId}`;
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = (hash << 5) - hash + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash) % 100;
        }
        /**
         * Sauvegarde une assignation
         */
        async saveAssignment(assignment) {
            // TODO: Sauvegarder dans table ExperimentAssignment
        }
    };
    __setFunctionName(_classThis, "ABTestingService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ABTestingService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ABTestingService = _classThis;
})();
exports.ABTestingService = ABTestingService;
