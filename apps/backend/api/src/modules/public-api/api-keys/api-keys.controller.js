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
exports.ApiKeysController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@/common/guards/jwt-auth.guard");
let ApiKeysController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('API Keys Management'), (0, common_1.Controller)('api-keys'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createApiKey_decorators;
    let _getApiKeys_decorators;
    let _getApiKey_decorators;
    let _updateApiKey_decorators;
    let _deleteApiKey_decorators;
    let _regenerateSecret_decorators;
    var ApiKeysController = _classThis = class {
        constructor(apiKeysService) {
            this.apiKeysService = (__runInitializers(this, _instanceExtraInitializers), apiKeysService);
        }
        async createApiKey(createApiKeyDto) {
            // Extract brandId from authenticated user context
            const brandId = this.getCurrentBrandId();
            return this.apiKeysService.createApiKey(brandId, createApiKeyDto);
        }
        async getApiKeys() {
            const brandId = this.getCurrentBrandId();
            return this.apiKeysService.listApiKeys(brandId);
        }
        async getApiKey(id) {
            const brandId = this.getCurrentBrandId();
            return this.apiKeysService.getApiKey(id, brandId);
        }
        async updateApiKey(id, updateApiKeyDto) {
            const brandId = this.getCurrentBrandId();
            return this.apiKeysService.updateApiKey(id, brandId, updateApiKeyDto);
        }
        async deleteApiKey(id) {
            const brandId = this.getCurrentBrandId();
            await this.apiKeysService.deleteApiKey(id, brandId);
        }
        async regenerateSecret(id) {
            const brandId = this.getCurrentBrandId();
            return this.apiKeysService.regenerateSecret(id, brandId);
        }
        getCurrentBrandId() {
            // This would be extracted from the authenticated user context
            // In a real implementation, this would come from the JWT token or session
            return global.currentBrandId || 'default-brand-id';
        }
    };
    __setFunctionName(_classThis, "ApiKeysController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createApiKey_decorators = [(0, common_1.Post)(), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({ summary: 'Create a new API key' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'API key created successfully' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid API key data' })];
        _getApiKeys_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Get all API keys for the current brand' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'API keys retrieved successfully' })];
        _getApiKey_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Get API key by ID' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'API key retrieved successfully' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'API key not found' })];
        _updateApiKey_decorators = [(0, common_1.Put)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Update API key' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'API key updated successfully' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'API key not found' })];
        _deleteApiKey_decorators = [(0, common_1.Delete)(':id'), (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT), (0, swagger_1.ApiOperation)({ summary: 'Delete API key' }), (0, swagger_1.ApiResponse)({ status: 204, description: 'API key deleted successfully' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'API key not found' })];
        _regenerateSecret_decorators = [(0, common_1.Post)(':id/regenerate'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Regenerate API key secret' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'API key secret regenerated successfully' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'API key not found' })];
        __esDecorate(_classThis, null, _createApiKey_decorators, { kind: "method", name: "createApiKey", static: false, private: false, access: { has: obj => "createApiKey" in obj, get: obj => obj.createApiKey }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getApiKeys_decorators, { kind: "method", name: "getApiKeys", static: false, private: false, access: { has: obj => "getApiKeys" in obj, get: obj => obj.getApiKeys }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getApiKey_decorators, { kind: "method", name: "getApiKey", static: false, private: false, access: { has: obj => "getApiKey" in obj, get: obj => obj.getApiKey }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateApiKey_decorators, { kind: "method", name: "updateApiKey", static: false, private: false, access: { has: obj => "updateApiKey" in obj, get: obj => obj.updateApiKey }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteApiKey_decorators, { kind: "method", name: "deleteApiKey", static: false, private: false, access: { has: obj => "deleteApiKey" in obj, get: obj => obj.deleteApiKey }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _regenerateSecret_decorators, { kind: "method", name: "regenerateSecret", static: false, private: false, access: { has: obj => "regenerateSecret" in obj, get: obj => obj.regenerateSecret }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ApiKeysController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ApiKeysController = _classThis;
})();
exports.ApiKeysController = ApiKeysController;
