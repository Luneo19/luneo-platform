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
exports.CADIntegrationService = void 0;
const common_1 = require("@nestjs/common");
/**
 * Service d'intégration CAD pour le module Render
 * Combine validation CAD, LOD, et rendu marketing
 */
let CADIntegrationService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CADIntegrationService = _classThis = class {
        constructor(cadValidation, lodService, marketingRender, variantService) {
            this.cadValidation = cadValidation;
            this.lodService = lodService;
            this.marketingRender = marketingRender;
            this.variantService = variantService;
            this.logger = new common_1.Logger(CADIntegrationService.name);
        }
        /**
         * Valide un design pour la production
         */
        async validateForProduction(request) {
            return this.cadValidation.validate(request);
        }
        /**
         * Génère les LODs pour un design
         */
        async generateLODs(designId, sourceModelUrl) {
            return this.lodService.generateLODs(designId, sourceModelUrl);
        }
        /**
         * Génère un rendu marketing
         */
        async generateMarketingRender(request) {
            return this.marketingRender.render(request);
        }
        /**
         * Génère un variant (matériau/pierre) sans re-export
         */
        async generateVariant(designId, baseModelUrl, material) {
            return this.variantService.generateVariant(designId, baseModelUrl, material);
        }
        /**
         * Génère plusieurs variants en batch
         */
        async generateVariantsBatch(designId, baseModelUrl, materials) {
            return this.variantService.generateVariantsBatch(designId, baseModelUrl, materials);
        }
    };
    __setFunctionName(_classThis, "CADIntegrationService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CADIntegrationService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CADIntegrationService = _classThis;
})();
exports.CADIntegrationService = CADIntegrationService;
