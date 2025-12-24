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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteOrderDto = exports.RoutingCriteriaDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
let RoutingCriteriaDto = (() => {
    var _a;
    let _productId_decorators;
    let _productId_initializers = [];
    let _productId_extraInitializers = [];
    let _material_decorators;
    let _material_initializers = [];
    let _material_extraInitializers = [];
    let _technique_decorators;
    let _technique_initializers = [];
    let _technique_extraInitializers = [];
    let _quantity_decorators;
    let _quantity_initializers = [];
    let _quantity_extraInitializers = [];
    let _urgency_decorators;
    let _urgency_initializers = [];
    let _urgency_extraInitializers = [];
    let _maxPrice_decorators;
    let _maxPrice_initializers = [];
    let _maxPrice_extraInitializers = [];
    let _maxLeadTime_decorators;
    let _maxLeadTime_initializers = [];
    let _maxLeadTime_extraInitializers = [];
    let _preferredZones_decorators;
    let _preferredZones_initializers = [];
    let _preferredZones_extraInitializers = [];
    return _a = class RoutingCriteriaDto {
            constructor() {
                this.productId = __runInitializers(this, _productId_initializers, void 0);
                this.material = (__runInitializers(this, _productId_extraInitializers), __runInitializers(this, _material_initializers, void 0));
                this.technique = (__runInitializers(this, _material_extraInitializers), __runInitializers(this, _technique_initializers, void 0));
                this.quantity = (__runInitializers(this, _technique_extraInitializers), __runInitializers(this, _quantity_initializers, void 0));
                this.urgency = (__runInitializers(this, _quantity_extraInitializers), __runInitializers(this, _urgency_initializers, void 0));
                this.maxPrice = (__runInitializers(this, _urgency_extraInitializers), __runInitializers(this, _maxPrice_initializers, void 0));
                this.maxLeadTime = (__runInitializers(this, _maxPrice_extraInitializers), __runInitializers(this, _maxLeadTime_initializers, void 0));
                this.preferredZones = (__runInitializers(this, _maxLeadTime_extraInitializers), __runInitializers(this, _preferredZones_initializers, void 0));
                __runInitializers(this, _preferredZones_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _productId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Product ID' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _material_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Material' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _technique_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Technique' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _quantity_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Quantity' }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.IsOptional)()];
            _urgency_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Urgency level', enum: ['standard', 'express', 'rush'] }), (0, class_validator_1.IsEnum)(['standard', 'express', 'rush']), (0, class_validator_1.IsOptional)()];
            _maxPrice_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Maximum price in cents' }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0), (0, class_validator_1.IsOptional)()];
            _maxLeadTime_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Maximum lead time in days' }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.IsOptional)()];
            _preferredZones_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Preferred zones', type: [String] }), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true }), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _productId_decorators, { kind: "field", name: "productId", static: false, private: false, access: { has: obj => "productId" in obj, get: obj => obj.productId, set: (obj, value) => { obj.productId = value; } }, metadata: _metadata }, _productId_initializers, _productId_extraInitializers);
            __esDecorate(null, null, _material_decorators, { kind: "field", name: "material", static: false, private: false, access: { has: obj => "material" in obj, get: obj => obj.material, set: (obj, value) => { obj.material = value; } }, metadata: _metadata }, _material_initializers, _material_extraInitializers);
            __esDecorate(null, null, _technique_decorators, { kind: "field", name: "technique", static: false, private: false, access: { has: obj => "technique" in obj, get: obj => obj.technique, set: (obj, value) => { obj.technique = value; } }, metadata: _metadata }, _technique_initializers, _technique_extraInitializers);
            __esDecorate(null, null, _quantity_decorators, { kind: "field", name: "quantity", static: false, private: false, access: { has: obj => "quantity" in obj, get: obj => obj.quantity, set: (obj, value) => { obj.quantity = value; } }, metadata: _metadata }, _quantity_initializers, _quantity_extraInitializers);
            __esDecorate(null, null, _urgency_decorators, { kind: "field", name: "urgency", static: false, private: false, access: { has: obj => "urgency" in obj, get: obj => obj.urgency, set: (obj, value) => { obj.urgency = value; } }, metadata: _metadata }, _urgency_initializers, _urgency_extraInitializers);
            __esDecorate(null, null, _maxPrice_decorators, { kind: "field", name: "maxPrice", static: false, private: false, access: { has: obj => "maxPrice" in obj, get: obj => obj.maxPrice, set: (obj, value) => { obj.maxPrice = value; } }, metadata: _metadata }, _maxPrice_initializers, _maxPrice_extraInitializers);
            __esDecorate(null, null, _maxLeadTime_decorators, { kind: "field", name: "maxLeadTime", static: false, private: false, access: { has: obj => "maxLeadTime" in obj, get: obj => obj.maxLeadTime, set: (obj, value) => { obj.maxLeadTime = value; } }, metadata: _metadata }, _maxLeadTime_initializers, _maxLeadTime_extraInitializers);
            __esDecorate(null, null, _preferredZones_decorators, { kind: "field", name: "preferredZones", static: false, private: false, access: { has: obj => "preferredZones" in obj, get: obj => obj.preferredZones, set: (obj, value) => { obj.preferredZones = value; } }, metadata: _metadata }, _preferredZones_initializers, _preferredZones_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.RoutingCriteriaDto = RoutingCriteriaDto;
let RouteOrderDto = (() => {
    var _a;
    let _artisanId_decorators;
    let _artisanId_initializers = [];
    let _artisanId_extraInitializers = [];
    let _quote_decorators;
    let _quote_initializers = [];
    let _quote_extraInitializers = [];
    return _a = class RouteOrderDto {
            constructor() {
                this.artisanId = __runInitializers(this, _artisanId_initializers, void 0);
                this.quote = (__runInitializers(this, _artisanId_extraInitializers), __runInitializers(this, _quote_initializers, void 0));
                __runInitializers(this, _quote_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _artisanId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Artisan ID' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _quote_decorators = [(0, swagger_1.ApiProperty)({ description: 'Quote details' })];
            __esDecorate(null, null, _artisanId_decorators, { kind: "field", name: "artisanId", static: false, private: false, access: { has: obj => "artisanId" in obj, get: obj => obj.artisanId, set: (obj, value) => { obj.artisanId = value; } }, metadata: _metadata }, _artisanId_initializers, _artisanId_extraInitializers);
            __esDecorate(null, null, _quote_decorators, { kind: "field", name: "quote", static: false, private: false, access: { has: obj => "quote" in obj, get: obj => obj.quote, set: (obj, value) => { obj.quote = value; } }, metadata: _metadata }, _quote_initializers, _quote_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.RouteOrderDto = RouteOrderDto;
