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
exports.CheckFraudDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
let CheckFraudDto = (() => {
    var _a;
    let _userId_decorators;
    let _userId_initializers = [];
    let _userId_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _ipAddress_decorators;
    let _ipAddress_initializers = [];
    let _ipAddress_extraInitializers = [];
    let _deviceFingerprint_decorators;
    let _deviceFingerprint_initializers = [];
    let _deviceFingerprint_extraInitializers = [];
    let _orderValue_decorators;
    let _orderValue_initializers = [];
    let _orderValue_extraInitializers = [];
    let _actionType_decorators;
    let _actionType_initializers = [];
    let _actionType_extraInitializers = [];
    return _a = class CheckFraudDto {
            constructor() {
                this.userId = __runInitializers(this, _userId_initializers, void 0);
                this.email = (__runInitializers(this, _userId_extraInitializers), __runInitializers(this, _email_initializers, void 0));
                this.ipAddress = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _ipAddress_initializers, void 0));
                this.deviceFingerprint = (__runInitializers(this, _ipAddress_extraInitializers), __runInitializers(this, _deviceFingerprint_initializers, void 0));
                this.orderValue = (__runInitializers(this, _deviceFingerprint_extraInitializers), __runInitializers(this, _orderValue_initializers, void 0));
                this.actionType = (__runInitializers(this, _orderValue_extraInitializers), __runInitializers(this, _actionType_initializers, void 0));
                __runInitializers(this, _actionType_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _userId_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'User ID' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _email_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Email address' }), (0, class_validator_1.IsEmail)(), (0, class_validator_1.IsOptional)()];
            _ipAddress_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'IP address' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _deviceFingerprint_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Device fingerprint' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _orderValue_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Order value in cents' }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0), (0, class_validator_1.IsOptional)()];
            _actionType_decorators = [(0, swagger_1.ApiProperty)({ description: 'Action type', enum: ['signup', 'login', 'order', 'payment'] }), (0, class_validator_1.IsEnum)(['signup', 'login', 'order', 'payment'])];
            __esDecorate(null, null, _userId_decorators, { kind: "field", name: "userId", static: false, private: false, access: { has: obj => "userId" in obj, get: obj => obj.userId, set: (obj, value) => { obj.userId = value; } }, metadata: _metadata }, _userId_initializers, _userId_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _ipAddress_decorators, { kind: "field", name: "ipAddress", static: false, private: false, access: { has: obj => "ipAddress" in obj, get: obj => obj.ipAddress, set: (obj, value) => { obj.ipAddress = value; } }, metadata: _metadata }, _ipAddress_initializers, _ipAddress_extraInitializers);
            __esDecorate(null, null, _deviceFingerprint_decorators, { kind: "field", name: "deviceFingerprint", static: false, private: false, access: { has: obj => "deviceFingerprint" in obj, get: obj => obj.deviceFingerprint, set: (obj, value) => { obj.deviceFingerprint = value; } }, metadata: _metadata }, _deviceFingerprint_initializers, _deviceFingerprint_extraInitializers);
            __esDecorate(null, null, _orderValue_decorators, { kind: "field", name: "orderValue", static: false, private: false, access: { has: obj => "orderValue" in obj, get: obj => obj.orderValue, set: (obj, value) => { obj.orderValue = value; } }, metadata: _metadata }, _orderValue_initializers, _orderValue_extraInitializers);
            __esDecorate(null, null, _actionType_decorators, { kind: "field", name: "actionType", static: false, private: false, access: { has: obj => "actionType" in obj, get: obj => obj.actionType, set: (obj, value) => { obj.actionType = value; } }, metadata: _metadata }, _actionType_initializers, _actionType_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.CheckFraudDto = CheckFraudDto;
