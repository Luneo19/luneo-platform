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
exports.RenderController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@/modules/auth/guards/jwt-auth.guard");
let RenderController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Render Engine'), (0, common_1.Controller)('render'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _render2D_decorators;
    let _render3D_decorators;
    let _getMetrics_decorators;
    let _validateCAD_decorators;
    let _generateLODs_decorators;
    let _getLOD_decorators;
    let _generateMarketingRender_decorators;
    let _generateVariant_decorators;
    let _generateVariantsBatch_decorators;
    var RenderController = _classThis = class {
        constructor(render2DService, render3DService, exportService, cadIntegration) {
            this.render2DService = (__runInitializers(this, _instanceExtraInitializers), render2DService);
            this.render3DService = render3DService;
            this.exportService = exportService;
            this.cadIntegration = cadIntegration;
        }
        async render2D(request) {
            return this.render2DService.render2D(request);
        }
        async render3D(request) {
            return this.render3DService.render3D(request);
        }
        async getMetrics() {
            return this.render2DService.getRenderMetrics();
        }
        async validateCAD(dto) {
            return this.cadIntegration.validateForProduction(dto);
        }
        async generateLODs(dto) {
            return this.cadIntegration.generateLODs(dto.designId, dto.sourceModelUrl);
        }
        async getLOD(designId, device = 'desktop') {
            // Utiliser LODService directement via CADIntegration
            // Pour l'instant, retourner une URL par défaut
            return { url: null, device };
        }
        async generateMarketingRender(dto) {
            return this.cadIntegration.generateMarketingRender(dto);
        }
        async generateVariant(dto) {
            return this.cadIntegration.generateVariant(dto.designId, dto.baseModelUrl, dto.material);
        }
        async generateVariantsBatch(dto) {
            return this.cadIntegration.generateVariantsBatch(dto.designId, dto.baseModelUrl, dto.materials);
        }
    };
    __setFunctionName(_classThis, "RenderController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _render2D_decorators = [(0, common_1.Post)('2d'), (0, swagger_1.ApiOperation)({ summary: 'Génère un rendu 2D' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Rendu généré avec succès' })];
        _render3D_decorators = [(0, common_1.Post)('3d'), (0, swagger_1.ApiOperation)({ summary: 'Génère un rendu 3D' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Rendu généré avec succès' })];
        _getMetrics_decorators = [(0, common_1.Get)('metrics'), (0, swagger_1.ApiOperation)({ summary: 'Obtient les métriques de rendu' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Métriques récupérées' })];
        _validateCAD_decorators = [(0, common_1.Post)('cad/validate'), (0, swagger_1.ApiOperation)({ summary: 'Valide un design CAD pour la production' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Validation CAD effectuée' })];
        _generateLODs_decorators = [(0, common_1.Post)('lod/generate'), (0, swagger_1.ApiOperation)({ summary: 'Génère les niveaux LOD pour un design' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'LODs générés' })];
        _getLOD_decorators = [(0, common_1.Get)('lod/:designId'), (0, swagger_1.ApiOperation)({ summary: 'Récupère l\'URL LOD appropriée' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'URL LOD récupérée' })];
        _generateMarketingRender_decorators = [(0, common_1.Post)('marketing'), (0, swagger_1.ApiOperation)({ summary: 'Génère un rendu marketing' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Rendu marketing généré' })];
        _generateVariant_decorators = [(0, common_1.Post)('variant'), (0, swagger_1.ApiOperation)({ summary: 'Génère un variant (matériau/pierre) sans re-export' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Variant généré' })];
        _generateVariantsBatch_decorators = [(0, common_1.Post)('variants/batch'), (0, swagger_1.ApiOperation)({ summary: 'Génère plusieurs variants en batch' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Variants générés' })];
        __esDecorate(_classThis, null, _render2D_decorators, { kind: "method", name: "render2D", static: false, private: false, access: { has: obj => "render2D" in obj, get: obj => obj.render2D }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _render3D_decorators, { kind: "method", name: "render3D", static: false, private: false, access: { has: obj => "render3D" in obj, get: obj => obj.render3D }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMetrics_decorators, { kind: "method", name: "getMetrics", static: false, private: false, access: { has: obj => "getMetrics" in obj, get: obj => obj.getMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _validateCAD_decorators, { kind: "method", name: "validateCAD", static: false, private: false, access: { has: obj => "validateCAD" in obj, get: obj => obj.validateCAD }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateLODs_decorators, { kind: "method", name: "generateLODs", static: false, private: false, access: { has: obj => "generateLODs" in obj, get: obj => obj.generateLODs }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getLOD_decorators, { kind: "method", name: "getLOD", static: false, private: false, access: { has: obj => "getLOD" in obj, get: obj => obj.getLOD }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateMarketingRender_decorators, { kind: "method", name: "generateMarketingRender", static: false, private: false, access: { has: obj => "generateMarketingRender" in obj, get: obj => obj.generateMarketingRender }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateVariant_decorators, { kind: "method", name: "generateVariant", static: false, private: false, access: { has: obj => "generateVariant" in obj, get: obj => obj.generateVariant }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateVariantsBatch_decorators, { kind: "method", name: "generateVariantsBatch", static: false, private: false, access: { has: obj => "generateVariantsBatch" in obj, get: obj => obj.generateVariantsBatch }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RenderController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RenderController = _classThis;
})();
exports.RenderController = RenderController;
