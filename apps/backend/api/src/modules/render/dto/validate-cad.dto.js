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
exports.ValidateCADDto = exports.ConstraintsDto = exports.CollisionConstraintsDto = exports.SettingConstraintsDto = exports.GeometricConstraintsDto = exports.ParametersDto = exports.SettingDto = exports.StoneDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
let StoneDto = (() => {
    var _a;
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _size_decorators;
    let _size_initializers = [];
    let _size_extraInitializers = [];
    let _position_decorators;
    let _position_initializers = [];
    let _position_extraInitializers = [];
    return _a = class StoneDto {
            constructor() {
                this.type = __runInitializers(this, _type_initializers, void 0);
                this.size = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _size_initializers, void 0));
                this.position = (__runInitializers(this, _size_extraInitializers), __runInitializers(this, _position_initializers, void 0));
                __runInitializers(this, _position_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _type_decorators = [(0, swagger_1.ApiProperty)({ description: 'Stone type' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _size_decorators = [(0, swagger_1.ApiProperty)({ description: 'Stone size in mm' }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsNotEmpty)()];
            _position_decorators = [(0, swagger_1.ApiProperty)({ description: 'Stone position', type: 'object' }), (0, class_validator_1.IsObject)()];
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _size_decorators, { kind: "field", name: "size", static: false, private: false, access: { has: obj => "size" in obj, get: obj => obj.size, set: (obj, value) => { obj.size = value; } }, metadata: _metadata }, _size_initializers, _size_extraInitializers);
            __esDecorate(null, null, _position_decorators, { kind: "field", name: "position", static: false, private: false, access: { has: obj => "position" in obj, get: obj => obj.position, set: (obj, value) => { obj.position = value; } }, metadata: _metadata }, _position_initializers, _position_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.StoneDto = StoneDto;
let SettingDto = (() => {
    var _a;
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _parameters_decorators;
    let _parameters_initializers = [];
    let _parameters_extraInitializers = [];
    return _a = class SettingDto {
            constructor() {
                this.type = __runInitializers(this, _type_initializers, void 0);
                this.parameters = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _parameters_initializers, void 0));
                __runInitializers(this, _parameters_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _type_decorators = [(0, swagger_1.ApiProperty)({ description: 'Setting type', enum: ['claw', 'pave', 'channel', 'bezel'] }), (0, class_validator_1.IsEnum)(['claw', 'pave', 'channel', 'bezel'])];
            _parameters_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Setting parameters' }), (0, class_validator_1.IsObject)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _parameters_decorators, { kind: "field", name: "parameters", static: false, private: false, access: { has: obj => "parameters" in obj, get: obj => obj.parameters, set: (obj, value) => { obj.parameters = value; } }, metadata: _metadata }, _parameters_initializers, _parameters_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.SettingDto = SettingDto;
let ParametersDto = (() => {
    var _a;
    let _ringSize_decorators;
    let _ringSize_initializers = [];
    let _ringSize_extraInitializers = [];
    let _metal_decorators;
    let _metal_initializers = [];
    let _metal_extraInitializers = [];
    let _thickness_decorators;
    let _thickness_initializers = [];
    let _thickness_extraInitializers = [];
    let _stones_decorators;
    let _stones_initializers = [];
    let _stones_extraInitializers = [];
    let _setting_decorators;
    let _setting_initializers = [];
    let _setting_extraInitializers = [];
    return _a = class ParametersDto {
            constructor() {
                this.ringSize = __runInitializers(this, _ringSize_initializers, void 0);
                this.metal = (__runInitializers(this, _ringSize_extraInitializers), __runInitializers(this, _metal_initializers, void 0));
                this.thickness = (__runInitializers(this, _metal_extraInitializers), __runInitializers(this, _thickness_initializers, void 0));
                this.stones = (__runInitializers(this, _thickness_extraInitializers), __runInitializers(this, _stones_initializers, void 0));
                this.setting = (__runInitializers(this, _stones_extraInitializers), __runInitializers(this, _setting_initializers, void 0));
                __runInitializers(this, _setting_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _ringSize_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Ring size' }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            _metal_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Metal type' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _thickness_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Thickness in mm' }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            _stones_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Stones', type: [StoneDto] }), (0, class_validator_1.IsArray)(), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(() => StoneDto), (0, class_validator_1.IsOptional)()];
            _setting_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Setting', type: SettingDto }), (0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(() => SettingDto), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _ringSize_decorators, { kind: "field", name: "ringSize", static: false, private: false, access: { has: obj => "ringSize" in obj, get: obj => obj.ringSize, set: (obj, value) => { obj.ringSize = value; } }, metadata: _metadata }, _ringSize_initializers, _ringSize_extraInitializers);
            __esDecorate(null, null, _metal_decorators, { kind: "field", name: "metal", static: false, private: false, access: { has: obj => "metal" in obj, get: obj => obj.metal, set: (obj, value) => { obj.metal = value; } }, metadata: _metadata }, _metal_initializers, _metal_extraInitializers);
            __esDecorate(null, null, _thickness_decorators, { kind: "field", name: "thickness", static: false, private: false, access: { has: obj => "thickness" in obj, get: obj => obj.thickness, set: (obj, value) => { obj.thickness = value; } }, metadata: _metadata }, _thickness_initializers, _thickness_extraInitializers);
            __esDecorate(null, null, _stones_decorators, { kind: "field", name: "stones", static: false, private: false, access: { has: obj => "stones" in obj, get: obj => obj.stones, set: (obj, value) => { obj.stones = value; } }, metadata: _metadata }, _stones_initializers, _stones_extraInitializers);
            __esDecorate(null, null, _setting_decorators, { kind: "field", name: "setting", static: false, private: false, access: { has: obj => "setting" in obj, get: obj => obj.setting, set: (obj, value) => { obj.setting = value; } }, metadata: _metadata }, _setting_initializers, _setting_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.ParametersDto = ParametersDto;
let GeometricConstraintsDto = (() => {
    var _a;
    let _minThickness_decorators;
    let _minThickness_initializers = [];
    let _minThickness_extraInitializers = [];
    let _maxThickness_decorators;
    let _maxThickness_initializers = [];
    let _maxThickness_extraInitializers = [];
    let _minRadius_decorators;
    let _minRadius_initializers = [];
    let _minRadius_extraInitializers = [];
    let _maxWeight_decorators;
    let _maxWeight_initializers = [];
    let _maxWeight_extraInitializers = [];
    let _minRingSize_decorators;
    let _minRingSize_initializers = [];
    let _minRingSize_extraInitializers = [];
    let _maxRingSize_decorators;
    let _maxRingSize_initializers = [];
    let _maxRingSize_extraInitializers = [];
    return _a = class GeometricConstraintsDto {
            constructor() {
                this.minThickness = __runInitializers(this, _minThickness_initializers, void 0);
                this.maxThickness = (__runInitializers(this, _minThickness_extraInitializers), __runInitializers(this, _maxThickness_initializers, void 0));
                this.minRadius = (__runInitializers(this, _maxThickness_extraInitializers), __runInitializers(this, _minRadius_initializers, void 0));
                this.maxWeight = (__runInitializers(this, _minRadius_extraInitializers), __runInitializers(this, _maxWeight_initializers, void 0));
                this.minRingSize = (__runInitializers(this, _maxWeight_extraInitializers), __runInitializers(this, _minRingSize_initializers, void 0));
                this.maxRingSize = (__runInitializers(this, _minRingSize_extraInitializers), __runInitializers(this, _maxRingSize_initializers, void 0));
                __runInitializers(this, _maxRingSize_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _minThickness_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Minimum thickness in mm' }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            _maxThickness_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Maximum thickness in mm' }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            _minRadius_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Minimum radius in mm' }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            _maxWeight_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Maximum weight in g' }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            _minRingSize_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Minimum ring size (US)' }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            _maxRingSize_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Maximum ring size (US)' }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _minThickness_decorators, { kind: "field", name: "minThickness", static: false, private: false, access: { has: obj => "minThickness" in obj, get: obj => obj.minThickness, set: (obj, value) => { obj.minThickness = value; } }, metadata: _metadata }, _minThickness_initializers, _minThickness_extraInitializers);
            __esDecorate(null, null, _maxThickness_decorators, { kind: "field", name: "maxThickness", static: false, private: false, access: { has: obj => "maxThickness" in obj, get: obj => obj.maxThickness, set: (obj, value) => { obj.maxThickness = value; } }, metadata: _metadata }, _maxThickness_initializers, _maxThickness_extraInitializers);
            __esDecorate(null, null, _minRadius_decorators, { kind: "field", name: "minRadius", static: false, private: false, access: { has: obj => "minRadius" in obj, get: obj => obj.minRadius, set: (obj, value) => { obj.minRadius = value; } }, metadata: _metadata }, _minRadius_initializers, _minRadius_extraInitializers);
            __esDecorate(null, null, _maxWeight_decorators, { kind: "field", name: "maxWeight", static: false, private: false, access: { has: obj => "maxWeight" in obj, get: obj => obj.maxWeight, set: (obj, value) => { obj.maxWeight = value; } }, metadata: _metadata }, _maxWeight_initializers, _maxWeight_extraInitializers);
            __esDecorate(null, null, _minRingSize_decorators, { kind: "field", name: "minRingSize", static: false, private: false, access: { has: obj => "minRingSize" in obj, get: obj => obj.minRingSize, set: (obj, value) => { obj.minRingSize = value; } }, metadata: _metadata }, _minRingSize_initializers, _minRingSize_extraInitializers);
            __esDecorate(null, null, _maxRingSize_decorators, { kind: "field", name: "maxRingSize", static: false, private: false, access: { has: obj => "maxRingSize" in obj, get: obj => obj.maxRingSize, set: (obj, value) => { obj.maxRingSize = value; } }, metadata: _metadata }, _maxRingSize_initializers, _maxRingSize_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.GeometricConstraintsDto = GeometricConstraintsDto;
let SettingConstraintsDto = (() => {
    var _a;
    let _minClawThickness_decorators;
    let _minClawThickness_initializers = [];
    let _minClawThickness_extraInitializers = [];
    let _minPaveSpacing_decorators;
    let _minPaveSpacing_initializers = [];
    let _minPaveSpacing_extraInitializers = [];
    let _maxStoneSize_decorators;
    let _maxStoneSize_initializers = [];
    let _maxStoneSize_extraInitializers = [];
    let _minStoneSize_decorators;
    let _minStoneSize_initializers = [];
    let _minStoneSize_extraInitializers = [];
    return _a = class SettingConstraintsDto {
            constructor() {
                this.minClawThickness = __runInitializers(this, _minClawThickness_initializers, void 0);
                this.minPaveSpacing = (__runInitializers(this, _minClawThickness_extraInitializers), __runInitializers(this, _minPaveSpacing_initializers, void 0));
                this.maxStoneSize = (__runInitializers(this, _minPaveSpacing_extraInitializers), __runInitializers(this, _maxStoneSize_initializers, void 0));
                this.minStoneSize = (__runInitializers(this, _maxStoneSize_extraInitializers), __runInitializers(this, _minStoneSize_initializers, void 0));
                __runInitializers(this, _minStoneSize_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _minClawThickness_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Minimum claw thickness in mm' }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            _minPaveSpacing_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Minimum pave spacing in mm' }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            _maxStoneSize_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Maximum stone size in mm' }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            _minStoneSize_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Minimum stone size in mm' }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _minClawThickness_decorators, { kind: "field", name: "minClawThickness", static: false, private: false, access: { has: obj => "minClawThickness" in obj, get: obj => obj.minClawThickness, set: (obj, value) => { obj.minClawThickness = value; } }, metadata: _metadata }, _minClawThickness_initializers, _minClawThickness_extraInitializers);
            __esDecorate(null, null, _minPaveSpacing_decorators, { kind: "field", name: "minPaveSpacing", static: false, private: false, access: { has: obj => "minPaveSpacing" in obj, get: obj => obj.minPaveSpacing, set: (obj, value) => { obj.minPaveSpacing = value; } }, metadata: _metadata }, _minPaveSpacing_initializers, _minPaveSpacing_extraInitializers);
            __esDecorate(null, null, _maxStoneSize_decorators, { kind: "field", name: "maxStoneSize", static: false, private: false, access: { has: obj => "maxStoneSize" in obj, get: obj => obj.maxStoneSize, set: (obj, value) => { obj.maxStoneSize = value; } }, metadata: _metadata }, _maxStoneSize_initializers, _maxStoneSize_extraInitializers);
            __esDecorate(null, null, _minStoneSize_decorators, { kind: "field", name: "minStoneSize", static: false, private: false, access: { has: obj => "minStoneSize" in obj, get: obj => obj.minStoneSize, set: (obj, value) => { obj.minStoneSize = value; } }, metadata: _metadata }, _minStoneSize_initializers, _minStoneSize_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.SettingConstraintsDto = SettingConstraintsDto;
let CollisionConstraintsDto = (() => {
    var _a;
    let _checkStoneClawCollision_decorators;
    let _checkStoneClawCollision_initializers = [];
    let _checkStoneClawCollision_extraInitializers = [];
    let _checkStoneStoneCollision_decorators;
    let _checkStoneStoneCollision_initializers = [];
    let _checkStoneStoneCollision_extraInitializers = [];
    let _minClearance_decorators;
    let _minClearance_initializers = [];
    let _minClearance_extraInitializers = [];
    return _a = class CollisionConstraintsDto {
            constructor() {
                this.checkStoneClawCollision = __runInitializers(this, _checkStoneClawCollision_initializers, void 0);
                this.checkStoneStoneCollision = (__runInitializers(this, _checkStoneClawCollision_extraInitializers), __runInitializers(this, _checkStoneStoneCollision_initializers, void 0));
                this.minClearance = (__runInitializers(this, _checkStoneStoneCollision_extraInitializers), __runInitializers(this, _minClearance_initializers, void 0));
                __runInitializers(this, _minClearance_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _checkStoneClawCollision_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Check stone-claw collision' }), (0, class_validator_1.IsOptional)()];
            _checkStoneStoneCollision_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Check stone-stone collision' }), (0, class_validator_1.IsOptional)()];
            _minClearance_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Minimum clearance in mm' }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _checkStoneClawCollision_decorators, { kind: "field", name: "checkStoneClawCollision", static: false, private: false, access: { has: obj => "checkStoneClawCollision" in obj, get: obj => obj.checkStoneClawCollision, set: (obj, value) => { obj.checkStoneClawCollision = value; } }, metadata: _metadata }, _checkStoneClawCollision_initializers, _checkStoneClawCollision_extraInitializers);
            __esDecorate(null, null, _checkStoneStoneCollision_decorators, { kind: "field", name: "checkStoneStoneCollision", static: false, private: false, access: { has: obj => "checkStoneStoneCollision" in obj, get: obj => obj.checkStoneStoneCollision, set: (obj, value) => { obj.checkStoneStoneCollision = value; } }, metadata: _metadata }, _checkStoneStoneCollision_initializers, _checkStoneStoneCollision_extraInitializers);
            __esDecorate(null, null, _minClearance_decorators, { kind: "field", name: "minClearance", static: false, private: false, access: { has: obj => "minClearance" in obj, get: obj => obj.minClearance, set: (obj, value) => { obj.minClearance = value; } }, metadata: _metadata }, _minClearance_initializers, _minClearance_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.CollisionConstraintsDto = CollisionConstraintsDto;
let ConstraintsDto = (() => {
    var _a;
    let _geometric_decorators;
    let _geometric_initializers = [];
    let _geometric_extraInitializers = [];
    let _setting_decorators;
    let _setting_initializers = [];
    let _setting_extraInitializers = [];
    let _collision_decorators;
    let _collision_initializers = [];
    let _collision_extraInitializers = [];
    return _a = class ConstraintsDto {
            constructor() {
                this.geometric = __runInitializers(this, _geometric_initializers, void 0);
                this.setting = (__runInitializers(this, _geometric_extraInitializers), __runInitializers(this, _setting_initializers, void 0));
                this.collision = (__runInitializers(this, _setting_extraInitializers), __runInitializers(this, _collision_initializers, void 0));
                __runInitializers(this, _collision_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _geometric_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Geometric constraints', type: GeometricConstraintsDto }), (0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(() => GeometricConstraintsDto), (0, class_validator_1.IsOptional)()];
            _setting_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Setting constraints', type: SettingConstraintsDto }), (0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(() => SettingConstraintsDto), (0, class_validator_1.IsOptional)()];
            _collision_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Collision constraints', type: CollisionConstraintsDto }), (0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(() => CollisionConstraintsDto), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _geometric_decorators, { kind: "field", name: "geometric", static: false, private: false, access: { has: obj => "geometric" in obj, get: obj => obj.geometric, set: (obj, value) => { obj.geometric = value; } }, metadata: _metadata }, _geometric_initializers, _geometric_extraInitializers);
            __esDecorate(null, null, _setting_decorators, { kind: "field", name: "setting", static: false, private: false, access: { has: obj => "setting" in obj, get: obj => obj.setting, set: (obj, value) => { obj.setting = value; } }, metadata: _metadata }, _setting_initializers, _setting_extraInitializers);
            __esDecorate(null, null, _collision_decorators, { kind: "field", name: "collision", static: false, private: false, access: { has: obj => "collision" in obj, get: obj => obj.collision, set: (obj, value) => { obj.collision = value; } }, metadata: _metadata }, _collision_initializers, _collision_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.ConstraintsDto = ConstraintsDto;
let ValidateCADDto = (() => {
    var _a;
    let _designId_decorators;
    let _designId_initializers = [];
    let _designId_extraInitializers = [];
    let _productId_decorators;
    let _productId_initializers = [];
    let _productId_extraInitializers = [];
    let _parameters_decorators;
    let _parameters_initializers = [];
    let _parameters_extraInitializers = [];
    let _constraints_decorators;
    let _constraints_initializers = [];
    let _constraints_extraInitializers = [];
    return _a = class ValidateCADDto {
            constructor() {
                this.designId = __runInitializers(this, _designId_initializers, void 0);
                this.productId = (__runInitializers(this, _designId_extraInitializers), __runInitializers(this, _productId_initializers, void 0));
                this.parameters = (__runInitializers(this, _productId_extraInitializers), __runInitializers(this, _parameters_initializers, void 0));
                this.constraints = (__runInitializers(this, _parameters_extraInitializers), __runInitializers(this, _constraints_initializers, void 0));
                __runInitializers(this, _constraints_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _designId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Design ID' }), (0, class_validator_1.IsString)()];
            _productId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Product ID' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _parameters_decorators = [(0, swagger_1.ApiProperty)({ description: 'Design parameters', type: ParametersDto }), (0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(() => ParametersDto)];
            _constraints_decorators = [(0, swagger_1.ApiProperty)({ description: 'Validation constraints', type: ConstraintsDto }), (0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(() => ConstraintsDto)];
            __esDecorate(null, null, _designId_decorators, { kind: "field", name: "designId", static: false, private: false, access: { has: obj => "designId" in obj, get: obj => obj.designId, set: (obj, value) => { obj.designId = value; } }, metadata: _metadata }, _designId_initializers, _designId_extraInitializers);
            __esDecorate(null, null, _productId_decorators, { kind: "field", name: "productId", static: false, private: false, access: { has: obj => "productId" in obj, get: obj => obj.productId, set: (obj, value) => { obj.productId = value; } }, metadata: _metadata }, _productId_initializers, _productId_extraInitializers);
            __esDecorate(null, null, _parameters_decorators, { kind: "field", name: "parameters", static: false, private: false, access: { has: obj => "parameters" in obj, get: obj => obj.parameters, set: (obj, value) => { obj.parameters = value; } }, metadata: _metadata }, _parameters_initializers, _parameters_extraInitializers);
            __esDecorate(null, null, _constraints_decorators, { kind: "field", name: "constraints", static: false, private: false, access: { has: obj => "constraints" in obj, get: obj => obj.constraints, set: (obj, value) => { obj.constraints = value; } }, metadata: _metadata }, _constraints_initializers, _constraints_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.ValidateCADDto = ValidateCADDto;
