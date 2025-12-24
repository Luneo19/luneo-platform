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
exports.PrometheusService = void 0;
const common_1 = require("@nestjs/common");
// Optional: prom-client (install with: npm install prom-client)
let Registry, Counter, Histogram, Gauge, collectDefaultMetrics;
try {
    const promClient = require('prom-client');
    Registry = promClient.Registry;
    Counter = promClient.Counter;
    Histogram = promClient.Histogram;
    Gauge = promClient.Gauge;
    collectDefaultMetrics = promClient.collectDefaultMetrics;
}
catch (e) {
    // prom-client not installed, will use fallback
}
/**
 * Prometheus Service
 * Expose métriques pour scraping Prometheus
 *
 * Usage:
 * ```typescript
 * this.prometheus.httpRequestsTotal.inc({ method: 'POST', route: '/api/designs', status: '200' });
 * this.prometheus.httpRequestDuration.observe({ method: 'POST', route: '/api/designs' }, 0.5);
 * ```
 */
let PrometheusService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PrometheusService = _classThis = class {
        constructor() {
            this.logger = new common_1.Logger(PrometheusService.name);
            if (!Registry) {
                this.logger.warn('prom-client not installed. Metrics will not be available.');
                // Create dummy objects to prevent errors
                this.registry = null;
                this.httpRequestsTotal = { inc: () => { } };
                this.httpRequestDuration = { observe: () => { } };
                this.httpRequestSize = { observe: () => { } };
                this.httpResponseSize = { observe: () => { } };
                this.designsCreated = { inc: () => { } };
                this.aiGenerations = { inc: () => { } };
                this.aiCosts = { inc: () => { } };
                this.ordersCreated = { inc: () => { } };
                this.renderRequests = { inc: () => { } };
                this.activeConnections = { set: () => { } };
                this.queueSize = { set: () => { } };
                this.cacheHitRate = { set: () => { } };
                return;
            }
            this.registry = new Registry();
            // Collect default metrics (CPU, memory, etc.)
            if (collectDefaultMetrics) {
                collectDefaultMetrics({ register: this.registry });
            }
            // HTTP Metrics
            this.httpRequestsTotal = new Counter({
                name: 'http_requests_total',
                help: 'Total number of HTTP requests',
                labelNames: ['method', 'route', 'status', 'brandId'],
                registers: [this.registry],
            });
            this.httpRequestDuration = new Histogram({
                name: 'http_request_duration_seconds',
                help: 'Duration of HTTP requests in seconds',
                labelNames: ['method', 'route', 'status'],
                buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
                registers: [this.registry],
            });
            this.httpRequestSize = new Histogram({
                name: 'http_request_size_bytes',
                help: 'Size of HTTP requests in bytes',
                labelNames: ['method', 'route'],
                buckets: [100, 1000, 5000, 10000, 50000, 100000],
                registers: [this.registry],
            });
            this.httpResponseSize = new Histogram({
                name: 'http_response_size_bytes',
                help: 'Size of HTTP responses in bytes',
                labelNames: ['method', 'route', 'status'],
                buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000],
                registers: [this.registry],
            });
            // Business Metrics
            this.designsCreated = new Counter({
                name: 'designs_created_total',
                help: 'Total number of designs created',
                labelNames: ['brandId', 'provider'],
                registers: [this.registry],
            });
            this.aiGenerations = new Counter({
                name: 'ai_generations_total',
                help: 'Total number of AI generations',
                labelNames: ['brandId', 'provider', 'model', 'stage'],
                registers: [this.registry],
            });
            this.aiCosts = new Counter({
                name: 'ai_costs_cents_total',
                help: 'Total AI costs in cents',
                labelNames: ['brandId', 'provider', 'model'],
                registers: [this.registry],
            });
            this.ordersCreated = new Counter({
                name: 'orders_created_total',
                help: 'Total number of orders created',
                labelNames: ['brandId', 'status'],
                registers: [this.registry],
            });
            this.renderRequests = new Counter({
                name: 'render_requests_total',
                help: 'Total number of render requests',
                labelNames: ['brandId', 'type', 'status'],
                registers: [this.registry],
            });
            // System Metrics
            this.activeConnections = new Gauge({
                name: 'active_connections',
                help: 'Number of active connections',
                labelNames: ['type'],
                registers: [this.registry],
            });
            this.queueSize = new Gauge({
                name: 'queue_size',
                help: 'Size of job queues',
                labelNames: ['queue'],
                registers: [this.registry],
            });
            this.cacheHitRate = new Gauge({
                name: 'cache_hit_rate',
                help: 'Cache hit rate (0-1)',
                labelNames: ['type'],
                registers: [this.registry],
            });
        }
        onModuleInit() {
            if (!Registry) {
                this.logger.warn('prom-client not installed. Install with: npm install prom-client');
                return;
            }
            this.logger.log('Prometheus metrics service initialized');
        }
        /**
         * Get metrics in Prometheus format
         */
        async getMetrics() {
            if (!this.registry) {
                return '# prom-client not installed. Install with: npm install prom-client\n';
            }
            return this.registry.metrics();
        }
        /**
         * Reset all metrics (useful for testing)
         */
        async resetMetrics() {
            if (this.registry) {
                await this.registry.resetMetrics();
            }
        }
    };
    __setFunctionName(_classThis, "PrometheusService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PrometheusService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PrometheusService = _classThis;
})();
exports.PrometheusService = PrometheusService;
