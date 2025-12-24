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
exports.CreateArtisanDto = exports.AddressDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
let AddressDto = (() => {
    var _a;
    let _street_decorators;
    let _street_initializers = [];
    let _street_extraInitializers = [];
    let _city_decorators;
    let _city_initializers = [];
    let _city_extraInitializers = [];
    let _postalCode_decorators;
    let _postalCode_initializers = [];
    let _postalCode_extraInitializers = [];
    let _country_decorators;
    let _country_initializers = [];
    let _country_extraInitializers = [];
    return _a = class AddressDto {
            constructor() {
                this.street = __runInitializers(this, _street_initializers, void 0);
                this.city = (__runInitializers(this, _street_extraInitializers), __runInitializers(this, _city_initializers, void 0));
                this.postalCode = (__runInitializers(this, _city_extraInitializers), __runInitializers(this, _postalCode_initializers, void 0));
                this.country = (__runInitializers(this, _postalCode_extraInitializers), __runInitializers(this, _country_initializers, void 0));
                __runInitializers(this, _country_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _street_decorators = [(0, swagger_1.ApiProperty)({ description: 'Street address' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _city_decorators = [(0, swagger_1.ApiProperty)({ description: 'City' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _postalCode_decorators = [(0, swagger_1.ApiProperty)({ description: 'Postal code' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _country_decorators = [(0, swagger_1.ApiProperty)({ description: 'Country' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            __esDecorate(null, null, _street_decorators, { kind: "field", name: "street", static: false, private: false, access: { has: obj => "street" in obj, get: obj => obj.street, set: (obj, value) => { obj.street = value; } }, metadata: _metadata }, _street_initializers, _street_extraInitializers);
            __esDecorate(null, null, _city_decorators, { kind: "field", name: "city", static: false, private: false, access: { has: obj => "city" in obj, get: obj => obj.city, set: (obj, value) => { obj.city = value; } }, metadata: _metadata }, _city_initializers, _city_extraInitializers);
            __esDecorate(null, null, _postalCode_decorators, { kind: "field", name: "postalCode", static: false, private: false, access: { has: obj => "postalCode" in obj, get: obj => obj.postalCode, set: (obj, value) => { obj.postalCode = value; } }, metadata: _metadata }, _postalCode_initializers, _postalCode_extraInitializers);
            __esDecorate(null, null, _country_decorators, { kind: "field", name: "country", static: false, private: false, access: { has: obj => "country" in obj, get: obj => obj.country, set: (obj, value) => { obj.country = value; } }, metadata: _metadata }, _country_initializers, _country_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.AddressDto = AddressDto;
let CreateArtisanDto = (() => {
    var _a;
    let _businessName_decorators;
    let _businessName_initializers = [];
    let _businessName_extraInitializers = [];
    let _legalName_decorators;
    let _legalName_initializers = [];
    let _legalName_extraInitializers = [];
    let _taxId_decorators;
    let _taxId_initializers = [];
    let _taxId_extraInitializers = [];
    let _address_decorators;
    let _address_initializers = [];
    let _address_extraInitializers = [];
    let _phone_decorators;
    let _phone_initializers = [];
    let _phone_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _website_decorators;
    let _website_initializers = [];
    let _website_extraInitializers = [];
    let _supportedMaterials_decorators;
    let _supportedMaterials_initializers = [];
    let _supportedMaterials_extraInitializers = [];
    let _supportedTechniques_decorators;
    let _supportedTechniques_initializers = [];
    let _supportedTechniques_extraInitializers = [];
    let _maxVolume_decorators;
    let _maxVolume_initializers = [];
    let _maxVolume_extraInitializers = [];
    let _averageLeadTime_decorators;
    let _averageLeadTime_initializers = [];
    let _averageLeadTime_extraInitializers = [];
    let _minOrderValue_decorators;
    let _minOrderValue_initializers = [];
    let _minOrderValue_extraInitializers = [];
    return _a = class CreateArtisanDto {
            constructor() {
                this.businessName = __runInitializers(this, _businessName_initializers, void 0);
                this.legalName = (__runInitializers(this, _businessName_extraInitializers), __runInitializers(this, _legalName_initializers, void 0));
                this.taxId = (__runInitializers(this, _legalName_extraInitializers), __runInitializers(this, _taxId_initializers, void 0));
                this.address = (__runInitializers(this, _taxId_extraInitializers), __runInitializers(this, _address_initializers, void 0));
                this.phone = (__runInitializers(this, _address_extraInitializers), __runInitializers(this, _phone_initializers, void 0));
                this.email = (__runInitializers(this, _phone_extraInitializers), __runInitializers(this, _email_initializers, void 0));
                this.website = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _website_initializers, void 0));
                this.supportedMaterials = (__runInitializers(this, _website_extraInitializers), __runInitializers(this, _supportedMaterials_initializers, void 0));
                this.supportedTechniques = (__runInitializers(this, _supportedMaterials_extraInitializers), __runInitializers(this, _supportedTechniques_initializers, void 0));
                this.maxVolume = (__runInitializers(this, _supportedTechniques_extraInitializers), __runInitializers(this, _maxVolume_initializers, void 0));
                this.averageLeadTime = (__runInitializers(this, _maxVolume_extraInitializers), __runInitializers(this, _averageLeadTime_initializers, void 0));
                this.minOrderValue = (__runInitializers(this, _averageLeadTime_extraInitializers), __runInitializers(this, _minOrderValue_initializers, void 0));
                __runInitializers(this, _minOrderValue_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _businessName_decorators = [(0, swagger_1.ApiProperty)({ description: 'Business name' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _legalName_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Legal name' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _taxId_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Tax ID' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _address_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Address', type: AddressDto }), (0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(() => AddressDto), (0, class_validator_1.IsOptional)()];
            _phone_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Phone number' }), (0, class_validator_1.IsPhoneNumber)(), (0, class_validator_1.IsOptional)()];
            _email_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Email address' }), (0, class_validator_1.IsEmail)(), (0, class_validator_1.IsOptional)()];
            _website_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Website URL' }), (0, class_validator_1.IsUrl)(), (0, class_validator_1.IsOptional)()];
            _supportedMaterials_decorators = [(0, swagger_1.ApiProperty)({ description: 'Supported materials', type: [String] }), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true })];
            _supportedTechniques_decorators = [(0, swagger_1.ApiProperty)({ description: 'Supported techniques', type: [String] }), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true })];
            _maxVolume_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Maximum volume capacity' }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.IsOptional)()];
            _averageLeadTime_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Average lead time in days' }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.IsOptional)()];
            _minOrderValue_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Minimum order value in cents' }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _businessName_decorators, { kind: "field", name: "businessName", static: false, private: false, access: { has: obj => "businessName" in obj, get: obj => obj.businessName, set: (obj, value) => { obj.businessName = value; } }, metadata: _metadata }, _businessName_initializers, _businessName_extraInitializers);
            __esDecorate(null, null, _legalName_decorators, { kind: "field", name: "legalName", static: false, private: false, access: { has: obj => "legalName" in obj, get: obj => obj.legalName, set: (obj, value) => { obj.legalName = value; } }, metadata: _metadata }, _legalName_initializers, _legalName_extraInitializers);
            __esDecorate(null, null, _taxId_decorators, { kind: "field", name: "taxId", static: false, private: false, access: { has: obj => "taxId" in obj, get: obj => obj.taxId, set: (obj, value) => { obj.taxId = value; } }, metadata: _metadata }, _taxId_initializers, _taxId_extraInitializers);
            __esDecorate(null, null, _address_decorators, { kind: "field", name: "address", static: false, private: false, access: { has: obj => "address" in obj, get: obj => obj.address, set: (obj, value) => { obj.address = value; } }, metadata: _metadata }, _address_initializers, _address_extraInitializers);
            __esDecorate(null, null, _phone_decorators, { kind: "field", name: "phone", static: false, private: false, access: { has: obj => "phone" in obj, get: obj => obj.phone, set: (obj, value) => { obj.phone = value; } }, metadata: _metadata }, _phone_initializers, _phone_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _website_decorators, { kind: "field", name: "website", static: false, private: false, access: { has: obj => "website" in obj, get: obj => obj.website, set: (obj, value) => { obj.website = value; } }, metadata: _metadata }, _website_initializers, _website_extraInitializers);
            __esDecorate(null, null, _supportedMaterials_decorators, { kind: "field", name: "supportedMaterials", static: false, private: false, access: { has: obj => "supportedMaterials" in obj, get: obj => obj.supportedMaterials, set: (obj, value) => { obj.supportedMaterials = value; } }, metadata: _metadata }, _supportedMaterials_initializers, _supportedMaterials_extraInitializers);
            __esDecorate(null, null, _supportedTechniques_decorators, { kind: "field", name: "supportedTechniques", static: false, private: false, access: { has: obj => "supportedTechniques" in obj, get: obj => obj.supportedTechniques, set: (obj, value) => { obj.supportedTechniques = value; } }, metadata: _metadata }, _supportedTechniques_initializers, _supportedTechniques_extraInitializers);
            __esDecorate(null, null, _maxVolume_decorators, { kind: "field", name: "maxVolume", static: false, private: false, access: { has: obj => "maxVolume" in obj, get: obj => obj.maxVolume, set: (obj, value) => { obj.maxVolume = value; } }, metadata: _metadata }, _maxVolume_initializers, _maxVolume_extraInitializers);
            __esDecorate(null, null, _averageLeadTime_decorators, { kind: "field", name: "averageLeadTime", static: false, private: false, access: { has: obj => "averageLeadTime" in obj, get: obj => obj.averageLeadTime, set: (obj, value) => { obj.averageLeadTime = value; } }, metadata: _metadata }, _averageLeadTime_initializers, _averageLeadTime_extraInitializers);
            __esDecorate(null, null, _minOrderValue_decorators, { kind: "field", name: "minOrderValue", static: false, private: false, access: { has: obj => "minOrderValue" in obj, get: obj => obj.minOrderValue, set: (obj, value) => { obj.minOrderValue = value; } }, metadata: _metadata }, _minOrderValue_initializers, _minOrderValue_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.CreateArtisanDto = CreateArtisanDto;
