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
exports.CreateQCReportDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
let CreateQCReportDto = (() => {
    var _a;
    let _workOrderId_decorators;
    let _workOrderId_initializers = [];
    let _workOrderId_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _qualityScore_decorators;
    let _qualityScore_initializers = [];
    let _qualityScore_extraInitializers = [];
    let _issues_decorators;
    let _issues_initializers = [];
    let _issues_extraInitializers = [];
    let _notes_decorators;
    let _notes_initializers = [];
    let _notes_extraInitializers = [];
    return _a = class CreateQCReportDto {
            constructor() {
                this.workOrderId = __runInitializers(this, _workOrderId_initializers, void 0);
                this.status = (__runInitializers(this, _workOrderId_extraInitializers), __runInitializers(this, _status_initializers, void 0));
                this.qualityScore = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _qualityScore_initializers, void 0));
                this.issues = (__runInitializers(this, _qualityScore_extraInitializers), __runInitializers(this, _issues_initializers, void 0));
                this.notes = (__runInitializers(this, _issues_extraInitializers), __runInitializers(this, _notes_initializers, void 0));
                __runInitializers(this, _notes_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _workOrderId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Work order ID' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _status_decorators = [(0, swagger_1.ApiProperty)({ description: 'QC status', enum: ['passed', 'failed', 'needs_revision'] }), (0, class_validator_1.IsEnum)(['passed', 'failed', 'needs_revision'])];
            _qualityScore_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Quality score (0-100)' }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(100), (0, class_validator_1.IsOptional)()];
            _issues_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Issues found' }), (0, class_validator_1.IsObject)(), (0, class_validator_1.IsOptional)()];
            _notes_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Notes' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _workOrderId_decorators, { kind: "field", name: "workOrderId", static: false, private: false, access: { has: obj => "workOrderId" in obj, get: obj => obj.workOrderId, set: (obj, value) => { obj.workOrderId = value; } }, metadata: _metadata }, _workOrderId_initializers, _workOrderId_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _qualityScore_decorators, { kind: "field", name: "qualityScore", static: false, private: false, access: { has: obj => "qualityScore" in obj, get: obj => obj.qualityScore, set: (obj, value) => { obj.qualityScore = value; } }, metadata: _metadata }, _qualityScore_initializers, _qualityScore_extraInitializers);
            __esDecorate(null, null, _issues_decorators, { kind: "field", name: "issues", static: false, private: false, access: { has: obj => "issues" in obj, get: obj => obj.issues, set: (obj, value) => { obj.issues = value; } }, metadata: _metadata }, _issues_initializers, _issues_extraInitializers);
            __esDecorate(null, null, _notes_decorators, { kind: "field", name: "notes", static: false, private: false, access: { has: obj => "notes" in obj, get: obj => obj.notes, set: (obj, value) => { obj.notes = value; } }, metadata: _metadata }, _notes_initializers, _notes_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.CreateQCReportDto = CreateQCReportDto;
