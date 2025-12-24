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
exports.CreateIPClaimDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
let CreateIPClaimDto = (() => {
    var _a;
    let _designId_decorators;
    let _designId_initializers = [];
    let _designId_extraInitializers = [];
    let _claimantName_decorators;
    let _claimantName_initializers = [];
    let _claimantName_extraInitializers = [];
    let _claimantEmail_decorators;
    let _claimantEmail_initializers = [];
    let _claimantEmail_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _supportingDocuments_decorators;
    let _supportingDocuments_initializers = [];
    let _supportingDocuments_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    return _a = class CreateIPClaimDto {
            constructor() {
                this.designId = __runInitializers(this, _designId_initializers, void 0);
                this.claimantName = (__runInitializers(this, _designId_extraInitializers), __runInitializers(this, _claimantName_initializers, void 0));
                this.claimantEmail = (__runInitializers(this, _claimantName_extraInitializers), __runInitializers(this, _claimantEmail_initializers, void 0));
                this.description = (__runInitializers(this, _claimantEmail_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.supportingDocuments = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _supportingDocuments_initializers, void 0));
                this.metadata = (__runInitializers(this, _supportingDocuments_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
                __runInitializers(this, _metadata_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _designId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Design ID being claimed' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _claimantName_decorators = [(0, swagger_1.ApiProperty)({ description: 'Claimant name' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _claimantEmail_decorators = [(0, swagger_1.ApiProperty)({ description: 'Claimant email' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _description_decorators = [(0, swagger_1.ApiProperty)({ description: 'Claim description' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _supportingDocuments_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Supporting documents URLs', type: [String] }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUrl)({}, { each: true })];
            _metadata_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Additional metadata' }), (0, class_validator_1.IsObject)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _designId_decorators, { kind: "field", name: "designId", static: false, private: false, access: { has: obj => "designId" in obj, get: obj => obj.designId, set: (obj, value) => { obj.designId = value; } }, metadata: _metadata }, _designId_initializers, _designId_extraInitializers);
            __esDecorate(null, null, _claimantName_decorators, { kind: "field", name: "claimantName", static: false, private: false, access: { has: obj => "claimantName" in obj, get: obj => obj.claimantName, set: (obj, value) => { obj.claimantName = value; } }, metadata: _metadata }, _claimantName_initializers, _claimantName_extraInitializers);
            __esDecorate(null, null, _claimantEmail_decorators, { kind: "field", name: "claimantEmail", static: false, private: false, access: { has: obj => "claimantEmail" in obj, get: obj => obj.claimantEmail, set: (obj, value) => { obj.claimantEmail = value; } }, metadata: _metadata }, _claimantEmail_initializers, _claimantEmail_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _supportingDocuments_decorators, { kind: "field", name: "supportingDocuments", static: false, private: false, access: { has: obj => "supportingDocuments" in obj, get: obj => obj.supportingDocuments, set: (obj, value) => { obj.supportingDocuments = value; } }, metadata: _metadata }, _supportingDocuments_initializers, _supportingDocuments_extraInitializers);
            __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.CreateIPClaimDto = CreateIPClaimDto;
