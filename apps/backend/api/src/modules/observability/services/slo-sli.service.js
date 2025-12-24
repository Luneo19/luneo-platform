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
exports.SLOService = void 0;
const common_1 = require("@nestjs/common");
const prometheus_helper_1 = require("@/libs/integrations/prometheus.helper");
let SLOService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SLOService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
            this.logger = new common_1.Logger(SLOService.name);
            // Définition des SLO par service
            this.SLO_TARGETS = [
                // API Backend
                {
                    service: 'api',
                    metric: 'latency',
                    target: 200, // 200ms p95
                    window: '24h',
                },
                {
                    service: 'api',
                    metric: 'error_rate',
                    target: 0.5, // 0.5% d'erreurs
                    window: '24h',
                },
                {
                    service: 'api',
                    metric: 'availability',
                    target: 99.9, // 99.9% uptime
                    window: '30d',
                },
                // AI Generation
                {
                    service: 'ai-generation',
                    metric: 'latency',
                    target: 5000, // 5s p95
                    window: '24h',
                },
                {
                    service: 'ai-generation',
                    metric: 'error_rate',
                    target: 2.0, // 2% d'erreurs (plus tolérant)
                    window: '24h',
                },
                // 3D Rendering
                {
                    service: 'render-3d',
                    metric: 'latency',
                    target: 10000, // 10s p95
                    window: '24h',
                },
                {
                    service: 'render-3d',
                    metric: 'error_rate',
                    target: 1.0, // 1% d'erreurs
                    window: '24h',
                },
                // Order Processing
                {
                    service: 'orders',
                    metric: 'latency',
                    target: 1000, // 1s p95
                    window: '24h',
                },
                {
                    service: 'orders',
                    metric: 'error_rate',
                    target: 0.1, // 0.1% d'erreurs (critique)
                    window: '24h',
                },
            ];
            this.prometheus = null;
            // Initialize Prometheus helper if URL is configured
            if (process.env.PROMETHEUS_URL) {
                this.prometheus = new prometheus_helper_1.PrometheusHelper();
            }
        }
        /**
         * Évalue tous les SLO
         */
        async evaluateAllSLOs() {
            const results = [];
            for (const target of this.SLO_TARGETS) {
                try {
                    const current = await this.getCurrentMetric(target);
                    const status = this.evaluateStatus(current, target.target, target.metric);
                    results.push({
                        service: target.service,
                        metric: target.metric,
                        target: target.target,
                        current,
                        status,
                        window: target.window,
                        timestamp: new Date(),
                    });
                }
                catch (error) {
                    this.logger.error(`Failed to evaluate SLO for ${target.service}.${target.metric}:`, error);
                }
            }
            return results;
        }
        /**
         * Récupère la métrique actuelle
         */
        async getCurrentMetric(target) {
            // TODO: Récupérer depuis Prometheus ou métriques stockées
            // Pour l'instant, simulation basée sur des données factices
            switch (target.metric) {
                case 'latency':
                    return this.getLatencyMetric(target.service, target.window);
                case 'error_rate':
                    return this.getErrorRateMetric(target.service, target.window);
                case 'availability':
                    return this.getAvailabilityMetric(target.service, target.window);
                case 'throughput':
                    return this.getThroughputMetric(target.service, target.window);
                default:
                    return 0;
            }
        }
        /**
         * Récupère la latence (p95)
         */
        async getLatencyMetric(service, window) {
            if (this.prometheus) {
                try {
                    return await this.prometheus.queryLatencyP95(service, window);
                }
                catch (error) {
                    this.logger.warn(`Failed to query Prometheus for latency: ${error.message}`);
                }
            }
            // Fallback: simulation
            const baseLatencies = {
                api: 150,
                'ai-generation': 4000,
                'render-3d': 8000,
                orders: 800,
            };
            return baseLatencies[service] || 1000;
        }
        /**
         * Récupère le taux d'erreur
         */
        async getErrorRateMetric(service, window) {
            if (this.prometheus) {
                try {
                    return await this.prometheus.queryErrorRate(service, window);
                }
                catch (error) {
                    this.logger.warn(`Failed to query Prometheus for error rate: ${error.message}`);
                }
            }
            // Fallback: simulation
            const baseErrorRates = {
                api: 0.2,
                'ai-generation': 1.5,
                'render-3d': 0.8,
                orders: 0.05,
            };
            return baseErrorRates[service] || 0.5;
        }
        /**
         * Récupère la disponibilité
         */
        async getAvailabilityMetric(service, window) {
            if (this.prometheus) {
                try {
                    return await this.prometheus.queryAvailability(service, window);
                }
                catch (error) {
                    this.logger.warn(`Failed to query Prometheus for availability: ${error.message}`);
                }
            }
            // Fallback: simulation
            return 99.95;
        }
        /**
         * Récupère le throughput
         */
        async getThroughputMetric(service, window) {
            if (this.prometheus) {
                try {
                    return await this.prometheus.queryThroughput(service, window);
                }
                catch (error) {
                    this.logger.warn(`Failed to query Prometheus for throughput: ${error.message}`);
                }
            }
            // Fallback: simulation
            return 1000;
        }
        /**
         * Évalue le statut (met/warning/breach)
         */
        evaluateStatus(current, target, metric) {
            if (metric === 'latency') {
                // Pour la latence, plus bas = mieux
                if (current <= target) {
                    return 'met';
                }
                else if (current <= target * 1.5) {
                    return 'warning';
                }
                else {
                    return 'breach';
                }
            }
            else if (metric === 'error_rate') {
                // Pour le taux d'erreur, plus bas = mieux
                if (current <= target) {
                    return 'met';
                }
                else if (current <= target * 2) {
                    return 'warning';
                }
                else {
                    return 'breach';
                }
            }
            else if (metric === 'availability') {
                // Pour la disponibilité, plus haut = mieux
                if (current >= target) {
                    return 'met';
                }
                else if (current >= target - 0.5) {
                    return 'warning';
                }
                else {
                    return 'breach';
                }
            }
            else {
                // Throughput: plus haut = mieux
                if (current >= target) {
                    return 'met';
                }
                else if (current >= target * 0.8) {
                    return 'warning';
                }
                else {
                    return 'breach';
                }
            }
        }
        /**
         * Sauvegarde les résultats SLO
         */
        async saveSLOResults(results) {
            // TODO: Sauvegarder dans une table SLORecord
            // Pour l'instant, log
            for (const result of results) {
                if (result.status === 'breach') {
                    this.logger.error(`SLO BREACH: ${result.service}.${result.metric} = ${result.current} (target: ${result.target})`);
                }
                else if (result.status === 'warning') {
                    this.logger.warn(`SLO WARNING: ${result.service}.${result.metric} = ${result.current} (target: ${result.target})`);
                }
            }
        }
        /**
         * Récupère l'historique SLO
         */
        async getSLOHistory(service, metric, days = 7) {
            // TODO: Récupérer depuis la table SLORecord
            return [];
        }
    };
    __setFunctionName(_classThis, "SLOService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SLOService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SLOService = _classThis;
})();
exports.SLOService = SLOService;
