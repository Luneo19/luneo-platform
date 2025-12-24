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
exports.WebhookPayloadDto = exports.WebhookEvent = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var WebhookEvent;
(function (WebhookEvent) {
    WebhookEvent["DESIGN_CREATED"] = "design.created";
    WebhookEvent["DESIGN_UPDATED"] = "design.updated";
    WebhookEvent["DESIGN_COMPLETED"] = "design.completed";
    WebhookEvent["DESIGN_FAILED"] = "design.failed";
    WebhookEvent["ORDER_CREATED"] = "order.created";
    WebhookEvent["ORDER_UPDATED"] = "order.updated";
    WebhookEvent["ORDER_PAID"] = "order.paid";
    WebhookEvent["ORDER_SHIPPED"] = "order.shipped";
    WebhookEvent["ORDER_DELIVERED"] = "order.delivered";
    WebhookEvent["ORDER_CANCELLED"] = "order.cancelled";
    WebhookEvent["TEST"] = "test";
})(WebhookEvent || (exports.WebhookEvent = WebhookEvent = {}));
let WebhookPayloadDto = (() => {
    var _a;
    let _event_decorators;
    let _event_initializers = [];
    let _event_extraInitializers = [];
    let _data_decorators;
    let _data_initializers = [];
    let _data_extraInitializers = [];
    let _timestamp_decorators;
    let _timestamp_initializers = [];
    let _timestamp_extraInitializers = [];
    let _signature_decorators;
    let _signature_initializers = [];
    let _signature_extraInitializers = [];
    return _a = class WebhookPayloadDto {
            constructor() {
                this.event = __runInitializers(this, _event_initializers, void 0);
                this.data = (__runInitializers(this, _event_extraInitializers), __runInitializers(this, _data_initializers, void 0));
                this.timestamp = (__runInitializers(this, _data_extraInitializers), __runInitializers(this, _timestamp_initializers, void 0));
                this.signature = (__runInitializers(this, _timestamp_extraInitializers), __runInitializers(this, _signature_initializers, void 0));
                __runInitializers(this, _signature_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _event_decorators = [(0, swagger_1.ApiProperty)({ description: 'Webhook event type' }), (0, class_validator_1.IsEnum)(WebhookEvent)];
            _data_decorators = [(0, swagger_1.ApiProperty)({ description: 'Event data payload' }), (0, class_validator_1.IsObject)()];
            _timestamp_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Timestamp of the event' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _signature_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Webhook signature for verification' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _event_decorators, { kind: "field", name: "event", static: false, private: false, access: { has: obj => "event" in obj, get: obj => obj.event, set: (obj, value) => { obj.event = value; } }, metadata: _metadata }, _event_initializers, _event_extraInitializers);
            __esDecorate(null, null, _data_decorators, { kind: "field", name: "data", static: false, private: false, access: { has: obj => "data" in obj, get: obj => obj.data, set: (obj, value) => { obj.data = value; } }, metadata: _metadata }, _data_initializers, _data_extraInitializers);
            __esDecorate(null, null, _timestamp_decorators, { kind: "field", name: "timestamp", static: false, private: false, access: { has: obj => "timestamp" in obj, get: obj => obj.timestamp, set: (obj, value) => { obj.timestamp = value; } }, metadata: _metadata }, _timestamp_initializers, _timestamp_extraInitializers);
            __esDecorate(null, null, _signature_decorators, { kind: "field", name: "signature", static: false, private: false, access: { has: obj => "signature" in obj, get: obj => obj.signature, set: (obj, value) => { obj.signature = value; } }, metadata: _metadata }, _signature_initializers, _signature_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.WebhookPayloadDto = WebhookPayloadDto;
