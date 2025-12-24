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
exports.IntegrationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@/common/guards/jwt-auth.guard");
let IntegrationsController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Integrations'), (0, common_1.Controller)('integrations'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getIntegrations_decorators;
    let _enableIntegration_decorators;
    let _disableIntegration_decorators;
    let _testIntegration_decorators;
    let _getStats_decorators;
    var IntegrationsController = _classThis = class {
        constructor(integrationsService) {
            this.integrationsService = (__runInitializers(this, _instanceExtraInitializers), integrationsService);
        }
        async getIntegrations() {
            const brandId = this.getCurrentBrandId();
            return this.integrationsService.getIntegrations(brandId);
        }
        async enableIntegration(type, config) {
            const brandId = this.getCurrentBrandId();
            return this.integrationsService.enableIntegration(brandId, type, config);
        }
        async disableIntegration(type) {
            const brandId = this.getCurrentBrandId();
            await this.integrationsService.disableIntegration(brandId, type);
        }
        async testIntegration(type, config) {
            const brandId = this.getCurrentBrandId();
            return this.integrationsService.testIntegration(brandId, type, config);
        }
        async getStats() {
            const brandId = this.getCurrentBrandId();
            return this.integrationsService.getIntegrationStats(brandId);
        }
        getCurrentBrandId() {
            return global.currentBrandId || 'default-brand-id';
        }
    };
    __setFunctionName(_classThis, "IntegrationsController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getIntegrations_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Get all integrations for the current brand' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Integrations retrieved successfully' })];
        _enableIntegration_decorators = [(0, common_1.Post)(':type/enable'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Enable an integration' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Integration enabled successfully' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid integration configuration' })];
        _disableIntegration_decorators = [(0, common_1.Delete)(':type'), (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT), (0, swagger_1.ApiOperation)({ summary: 'Disable an integration' }), (0, swagger_1.ApiResponse)({ status: 204, description: 'Integration disabled successfully' })];
        _testIntegration_decorators = [(0, common_1.Post)(':type/test'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Test integration connection' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Integration test completed' })];
        _getStats_decorators = [(0, common_1.Get)('stats'), (0, swagger_1.ApiOperation)({ summary: 'Get integration statistics' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Integration stats retrieved successfully' })];
        __esDecorate(_classThis, null, _getIntegrations_decorators, { kind: "method", name: "getIntegrations", static: false, private: false, access: { has: obj => "getIntegrations" in obj, get: obj => obj.getIntegrations }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _enableIntegration_decorators, { kind: "method", name: "enableIntegration", static: false, private: false, access: { has: obj => "enableIntegration" in obj, get: obj => obj.enableIntegration }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _disableIntegration_decorators, { kind: "method", name: "disableIntegration", static: false, private: false, access: { has: obj => "disableIntegration" in obj, get: obj => obj.disableIntegration }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _testIntegration_decorators, { kind: "method", name: "testIntegration", static: false, private: false, access: { has: obj => "testIntegration" in obj, get: obj => obj.testIntegration }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getStats_decorators, { kind: "method", name: "getStats", static: false, private: false, access: { has: obj => "getStats" in obj, get: obj => obj.getStats }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        IntegrationsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return IntegrationsController = _classThis;
})();
exports.IntegrationsController = IntegrationsController;
