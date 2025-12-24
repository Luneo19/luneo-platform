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
exports.AttributionService = void 0;
const common_1 = require("@nestjs/common");
let AttributionService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AttributionService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
            this.logger = new common_1.Logger(AttributionService.name);
        }
        /**
         * Parse les paramètres UTM
         */
        parseUTMParams(params) {
            const utmSource = params.utm_source;
            const utmMedium = params.utm_medium;
            const utmCampaign = params.utm_campaign;
            const utmTerm = params.utm_term;
            const utmContent = params.utm_content;
            let source = 'direct';
            if (utmSource) {
                if (utmSource === 'google' || utmSource === 'bing') {
                    source = 'organic';
                }
                else if (utmMedium === 'cpc' || utmMedium === 'paid') {
                    source = 'paid';
                }
                else if (utmMedium === 'email') {
                    source = 'email';
                }
                else if (utmMedium === 'social') {
                    source = 'social';
                }
                else {
                    source = 'referral';
                }
            }
            return {
                source,
                medium: utmMedium,
                campaign: utmCampaign,
                term: utmTerm,
                content: utmContent,
            };
        }
        /**
         * Enregistre une attribution
         */
        async recordAttribution(attribution) {
            // TODO: Sauvegarder dans table Attribution
            this.logger.debug(`Attribution recorded: ${attribution.source} -> ${attribution.landingPage}`);
        }
        /**
         * Enregistre un événement de conversion
         */
        async recordConversion(event) {
            // TODO: Sauvegarder dans table Conversion
            this.logger.log(`Conversion recorded: ${event.eventType} (value: ${event.value || 0}) from ${event.attribution.source}`);
        }
        /**
         * Récupère l'attribution d'une session
         */
        async getSessionAttribution(sessionId) {
            // TODO: Récupérer depuis table Attribution
            return null;
        }
        /**
         * Récupère les conversions par source
         */
        async getConversionsBySource(startDate, endDate) {
            // TODO: Agréger depuis table Conversion
            return {};
        }
        /**
         * Récupère le ROI par campagne
         */
        async getCampaignROI(startDate, endDate) {
            // TODO: Calculer depuis table Conversion + coûts campagnes
            return [];
        }
    };
    __setFunctionName(_classThis, "AttributionService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AttributionService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AttributionService = _classThis;
})();
exports.AttributionService = AttributionService;
