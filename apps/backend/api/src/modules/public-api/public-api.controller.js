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
exports.PublicApiController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_key_guard_1 = require("./guards/api-key.guard");
const rate_limit_guard_1 = require("./rate-limit/rate-limit.guard");
let PublicApiController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Public API'), (0, common_1.Controller)('api/v1'), (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard, rate_limit_guard_1.RateLimitGuard), (0, swagger_1.ApiBearerAuth)('api-key')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _health_decorators;
    let _getBrand_decorators;
    let _getProducts_decorators;
    let _getProduct_decorators;
    let _createDesign_decorators;
    let _getDesign_decorators;
    let _createOrder_decorators;
    let _getOrder_decorators;
    let _getOrders_decorators;
    let _getAnalytics_decorators;
    let _testWebhook_decorators;
    var PublicApiController = _classThis = class {
        constructor(publicApiService) {
            this.publicApiService = (__runInitializers(this, _instanceExtraInitializers), publicApiService);
        }
        async health() {
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            };
        }
        async getBrand() {
            return this.publicApiService.getBrandInfo();
        }
        async getProducts(page = 1, limit = 10) {
            return this.publicApiService.getProducts(page, limit);
        }
        async getProduct(id) {
            return this.publicApiService.getProduct(id);
        }
        async createDesign(createDesignDto) {
            return this.publicApiService.createDesign(createDesignDto);
        }
        async getDesign(id) {
            return this.publicApiService.getDesign(id);
        }
        async createOrder(createOrderDto) {
            return this.publicApiService.createOrder(createOrderDto);
        }
        async getOrder(id) {
            return this.publicApiService.getOrder(id);
        }
        async getOrders(page = 1, limit = 10, status) {
            return this.publicApiService.getOrders(page, limit, status);
        }
        async getAnalytics(query) {
            return this.publicApiService.getAnalytics(query);
        }
        async testWebhook(payload) {
            return this.publicApiService.testWebhook(payload);
        }
    };
    __setFunctionName(_classThis, "PublicApiController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _health_decorators = [(0, common_1.Get)('health'), (0, swagger_1.ApiOperation)({ summary: 'Health check endpoint' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'API is healthy' })];
        _getBrand_decorators = [(0, common_1.Get)('brand'), (0, swagger_1.ApiOperation)({ summary: 'Get brand information' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Brand information retrieved successfully' })];
        _getProducts_decorators = [(0, common_1.Get)('products'), (0, swagger_1.ApiOperation)({ summary: 'Get all products' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Products retrieved successfully' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number })];
        _getProduct_decorators = [(0, common_1.Get)('products/:id'), (0, swagger_1.ApiOperation)({ summary: 'Get product by ID' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Product retrieved successfully' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Product not found' })];
        _createDesign_decorators = [(0, common_1.Post)('designs'), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({ summary: 'Create a new design' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Design created successfully' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid design data' })];
        _getDesign_decorators = [(0, common_1.Get)('designs/:id'), (0, swagger_1.ApiOperation)({ summary: 'Get design by ID' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Design retrieved successfully' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Design not found' })];
        _createOrder_decorators = [(0, common_1.Post)('orders'), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({ summary: 'Create a new order' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Order created successfully' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid order data' })];
        _getOrder_decorators = [(0, common_1.Get)('orders/:id'), (0, swagger_1.ApiOperation)({ summary: 'Get order by ID' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Order retrieved successfully' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Order not found' })];
        _getOrders_decorators = [(0, common_1.Get)('orders'), (0, swagger_1.ApiOperation)({ summary: 'Get orders with filters' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Orders retrieved successfully' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String })];
        _getAnalytics_decorators = [(0, common_1.Get)('analytics'), (0, swagger_1.ApiOperation)({ summary: 'Get analytics data' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Analytics retrieved successfully' })];
        _testWebhook_decorators = [(0, common_1.Post)('webhooks/test'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Test webhook endpoint' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook test successful' })];
        __esDecorate(_classThis, null, _health_decorators, { kind: "method", name: "health", static: false, private: false, access: { has: obj => "health" in obj, get: obj => obj.health }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBrand_decorators, { kind: "method", name: "getBrand", static: false, private: false, access: { has: obj => "getBrand" in obj, get: obj => obj.getBrand }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getProducts_decorators, { kind: "method", name: "getProducts", static: false, private: false, access: { has: obj => "getProducts" in obj, get: obj => obj.getProducts }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getProduct_decorators, { kind: "method", name: "getProduct", static: false, private: false, access: { has: obj => "getProduct" in obj, get: obj => obj.getProduct }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createDesign_decorators, { kind: "method", name: "createDesign", static: false, private: false, access: { has: obj => "createDesign" in obj, get: obj => obj.createDesign }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getDesign_decorators, { kind: "method", name: "getDesign", static: false, private: false, access: { has: obj => "getDesign" in obj, get: obj => obj.getDesign }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createOrder_decorators, { kind: "method", name: "createOrder", static: false, private: false, access: { has: obj => "createOrder" in obj, get: obj => obj.createOrder }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getOrder_decorators, { kind: "method", name: "getOrder", static: false, private: false, access: { has: obj => "getOrder" in obj, get: obj => obj.getOrder }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getOrders_decorators, { kind: "method", name: "getOrders", static: false, private: false, access: { has: obj => "getOrders" in obj, get: obj => obj.getOrders }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAnalytics_decorators, { kind: "method", name: "getAnalytics", static: false, private: false, access: { has: obj => "getAnalytics" in obj, get: obj => obj.getAnalytics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _testWebhook_decorators, { kind: "method", name: "testWebhook", static: false, private: false, access: { has: obj => "testWebhook" in obj, get: obj => obj.testWebhook }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PublicApiController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PublicApiController = _classThis;
})();
exports.PublicApiController = PublicApiController;
