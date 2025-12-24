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
exports.GenerateVariantsBatchDto = exports.GenerateVariantDto = exports.MaterialDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
let MaterialDto = (() => {
    var _a;
    let _materialId_decorators;
    let _materialId_initializers = [];
    let _materialId_extraInitializers = [];
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _properties_decorators;
    let _properties_initializers = [];
    let _properties_extraInitializers = [];
    return _a = class MaterialDto {
            constructor() {
                this.materialId = __runInitializers(this, _materialId_initializers, void 0);
                this.name = (__runInitializers(this, _materialId_extraInitializers), __runInitializers(this, _name_initializers, void 0));
                this.type = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _type_initializers, void 0));
                this.properties = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _properties_initializers, void 0));
                __runInitializers(this, _properties_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _materialId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Material ID' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _name_decorators = [(0, swagger_1.ApiProperty)({ description: 'Material name' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _type_decorators = [(0, swagger_1.ApiProperty)({ description: 'Material type', enum: ['metal', 'stone', 'finish'] }), (0, class_validator_1.IsEnum)(['metal', 'stone', 'finish'])];
            _properties_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Material properties' }), (0, class_validator_1.IsObject)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _materialId_decorators, { kind: "field", name: "materialId", static: false, private: false, access: { has: obj => "materialId" in obj, get: obj => obj.materialId, set: (obj, value) => { obj.materialId = value; } }, metadata: _metadata }, _materialId_initializers, _materialId_extraInitializers);
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _properties_decorators, { kind: "field", name: "properties", static: false, private: false, access: { has: obj => "properties" in obj, get: obj => obj.properties, set: (obj, value) => { obj.properties = value; } }, metadata: _metadata }, _properties_initializers, _properties_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.MaterialDto = MaterialDto;
let GenerateVariantDto = (() => {
    var _a;
    let _designId_decorators;
    let _designId_initializers = [];
    let _designId_extraInitializers = [];
    let _baseModelUrl_decorators;
    let _baseModelUrl_initializers = [];
    let _baseModelUrl_extraInitializers = [];
    let _material_decorators;
    let _material_initializers = [];
    let _material_extraInitializers = [];
    return _a = class GenerateVariantDto {
            constructor() {
                this.designId = __runInitializers(this, _designId_initializers, void 0);
                this.baseModelUrl = (__runInitializers(this, _designId_extraInitializers), __runInitializers(this, _baseModelUrl_initializers, void 0));
                this.material = (__runInitializers(this, _baseModelUrl_extraInitializers), __runInitializers(this, _material_initializers, void 0));
                __runInitializers(this, _material_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _designId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Design ID' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _baseModelUrl_decorators = [(0, swagger_1.ApiProperty)({ description: 'Base model URL' }), (0, class_validator_1.IsUrl)(), (0, class_validator_1.IsNotEmpty)()];
            _material_decorators = [(0, swagger_1.ApiProperty)({ description: 'Material', type: MaterialDto }), (0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(() => MaterialDto)];
            __esDecorate(null, null, _designId_decorators, { kind: "field", name: "designId", static: false, private: false, access: { has: obj => "designId" in obj, get: obj => obj.designId, set: (obj, value) => { obj.designId = value; } }, metadata: _metadata }, _designId_initializers, _designId_extraInitializers);
            __esDecorate(null, null, _baseModelUrl_decorators, { kind: "field", name: "baseModelUrl", static: false, private: false, access: { has: obj => "baseModelUrl" in obj, get: obj => obj.baseModelUrl, set: (obj, value) => { obj.baseModelUrl = value; } }, metadata: _metadata }, _baseModelUrl_initializers, _baseModelUrl_extraInitializers);
            __esDecorate(null, null, _material_decorators, { kind: "field", name: "material", static: false, private: false, access: { has: obj => "material" in obj, get: obj => obj.material, set: (obj, value) => { obj.material = value; } }, metadata: _metadata }, _material_initializers, _material_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.GenerateVariantDto = GenerateVariantDto;
let GenerateVariantsBatchDto = (() => {
    var _a;
    let _designId_decorators;
    let _designId_initializers = [];
    let _designId_extraInitializers = [];
    let _baseModelUrl_decorators;
    let _baseModelUrl_initializers = [];
    let _baseModelUrl_extraInitializers = [];
    let _materials_decorators;
    let _materials_initializers = [];
    let _materials_extraInitializers = [];
    return _a = class GenerateVariantsBatchDto {
            constructor() {
                this.designId = __runInitializers(this, _designId_initializers, void 0);
                this.baseModelUrl = (__runInitializers(this, _designId_extraInitializers), __runInitializers(this, _baseModelUrl_initializers, void 0));
                this.materials = (__runInitializers(this, _baseModelUrl_extraInitializers), __runInitializers(this, _materials_initializers, void 0));
                __runInitializers(this, _materials_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _designId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Design ID' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _baseModelUrl_decorators = [(0, swagger_1.ApiProperty)({ description: 'Base model URL' }), (0, class_validator_1.IsUrl)(), (0, class_validator_1.IsNotEmpty)()];
            _materials_decorators = [(0, swagger_1.ApiProperty)({ description: 'Materials', type: [MaterialDto] }), (0, class_validator_1.IsArray)(), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(() => MaterialDto)];
            __esDecorate(null, null, _designId_decorators, { kind: "field", name: "designId", static: false, private: false, access: { has: obj => "designId" in obj, get: obj => obj.designId, set: (obj, value) => { obj.designId = value; } }, metadata: _metadata }, _designId_initializers, _designId_extraInitializers);
            __esDecorate(null, null, _baseModelUrl_decorators, { kind: "field", name: "baseModelUrl", static: false, private: false, access: { has: obj => "baseModelUrl" in obj, get: obj => obj.baseModelUrl, set: (obj, value) => { obj.baseModelUrl = value; } }, metadata: _metadata }, _baseModelUrl_initializers, _baseModelUrl_extraInitializers);
            __esDecorate(null, null, _materials_decorators, { kind: "field", name: "materials", static: false, private: false, access: { has: obj => "materials" in obj, get: obj => obj.materials, set: (obj, value) => { obj.materials = value; } }, metadata: _metadata }, _materials_initializers, _materials_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.GenerateVariantsBatchDto = GenerateVariantsBatchDto;
