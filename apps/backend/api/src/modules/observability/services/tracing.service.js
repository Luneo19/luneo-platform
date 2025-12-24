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
exports.TracingService = void 0;
const common_1 = require("@nestjs/common");
let TracingService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var TracingService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
            this.logger = new common_1.Logger(TracingService.name);
        }
        /**
         * Crée un span de trace
         */
        startSpan(service, operation, traceId, parentSpanId) {
            const span = {
                traceId: traceId || this.generateTraceId(),
                spanId: this.generateSpanId(),
                parentSpanId,
                service,
                operation,
                startTime: new Date(),
                status: 'success',
                tags: {},
                logs: [],
            };
            return span;
        }
        /**
         * Finalise un span
         */
        finishSpan(span, status = 'success', error) {
            span.endTime = new Date();
            span.duration = span.endTime.getTime() - span.startTime.getTime();
            span.status = status;
            if (error) {
                span.logs?.push({
                    timestamp: new Date(),
                    message: error.message,
                    level: 'error',
                });
                span.tags = {
                    ...span.tags,
                    'error.type': error.constructor.name,
                    'error.message': error.message,
                };
            }
            // Sauvegarder le span
            this.saveSpan(span);
            return span;
        }
        /**
         * Ajoute un tag à un span
         */
        addTag(span, key, value) {
            if (!span.tags) {
                span.tags = {};
            }
            span.tags[key] = value;
        }
        /**
         * Ajoute un log à un span
         */
        addLog(span, message, level = 'info') {
            if (!span.logs) {
                span.logs = [];
            }
            span.logs.push({
                timestamp: new Date(),
                message,
                level,
            });
        }
        /**
         * Récupère une trace complète
         */
        async getTrace(traceId) {
            // TODO: Récupérer depuis la table Trace
            // Pour l'instant, retourner vide
            return [];
        }
        /**
         * Récupère les traces d'un service
         */
        async getServiceTraces(service, limit = 100) {
            // TODO: Récupérer depuis la table Trace
            return [];
        }
        /**
         * Sauvegarde un span
         */
        async saveSpan(span) {
            // TODO: Sauvegarder dans une table Trace
            // Pour l'instant, log seulement les erreurs
            if (span.status === 'error') {
                this.logger.debug(`Trace error: ${span.traceId}/${span.spanId} - ${span.service}.${span.operation}`, {
                    duration: span.duration,
                    tags: span.tags,
                });
            }
        }
        /**
         * Génère un Trace ID
         */
        generateTraceId() {
            return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        /**
         * Génère un Span ID
         */
        generateSpanId() {
            return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        /**
         * Crée un decorator pour tracer automatiquement les méthodes
         */
        static Trace(service, operation) {
            return function (target, propertyKey, descriptor) {
                const originalMethod = descriptor.value;
                const opName = operation || propertyKey;
                descriptor.value = async function (...args) {
                    // TODO: Intégrer avec OpenTelemetry
                    // Pour l'instant, wrapper simple
                    const startTime = Date.now();
                    try {
                        const result = await originalMethod.apply(this, args);
                        const duration = Date.now() - startTime;
                        // Log si durée > seuil
                        if (duration > 1000) {
                            console.log(`[TRACE] ${service}.${opName} took ${duration}ms`);
                        }
                        return result;
                    }
                    catch (error) {
                        const duration = Date.now() - startTime;
                        console.error(`[TRACE ERROR] ${service}.${opName} failed after ${duration}ms:`, error);
                        throw error;
                    }
                };
                return descriptor;
            };
        }
    };
    __setFunctionName(_classThis, "TracingService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TracingService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TracingService = _classThis;
})();
exports.TracingService = TracingService;
