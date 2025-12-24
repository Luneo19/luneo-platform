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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcommerceModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const bull_1 = require("@nestjs/bull");
const ecommerce_controller_1 = require("./ecommerce.controller");
const woocommerce_webhook_controller_1 = require("./controllers/woocommerce-webhook.controller");
const shopify_connector_1 = require("./connectors/shopify/shopify.connector");
const woocommerce_connector_1 = require("./connectors/woocommerce/woocommerce.connector");
const magento_connector_1 = require("./connectors/magento/magento.connector");
const product_sync_service_1 = require("./services/product-sync.service");
const order_sync_service_1 = require("./services/order-sync.service");
const webhook_handler_service_1 = require("./services/webhook-handler.service");
const woocommerce_webhook_service_1 = require("./services/woocommerce-webhook.service");
const prisma_module_1 = require("@/libs/prisma/prisma.module");
const smart_cache_module_1 = require("@/libs/cache/smart-cache.module");
let EcommerceModule = (() => {
    let _classDecorators = [(0, common_1.Module)({
            imports: [
                prisma_module_1.PrismaModule,
                smart_cache_module_1.SmartCacheModule,
                axios_1.HttpModule,
                bull_1.BullModule.registerQueue({
                    name: 'ecommerce-sync',
                }),
                bull_1.BullModule.registerQueue({
                    name: 'ecommerce-webhooks',
                }),
            ],
            controllers: [ecommerce_controller_1.EcommerceController, woocommerce_webhook_controller_1.WooCommerceWebhookController],
            providers: [
                shopify_connector_1.ShopifyConnector,
                woocommerce_connector_1.WooCommerceConnector,
                magento_connector_1.MagentoConnector,
                product_sync_service_1.ProductSyncService,
                order_sync_service_1.OrderSyncService,
                webhook_handler_service_1.WebhookHandlerService,
                woocommerce_webhook_service_1.WooCommerceWebhookService,
            ],
            exports: [
                shopify_connector_1.ShopifyConnector,
                woocommerce_connector_1.WooCommerceConnector,
                magento_connector_1.MagentoConnector,
                product_sync_service_1.ProductSyncService,
                order_sync_service_1.OrderSyncService,
                woocommerce_webhook_service_1.WooCommerceWebhookService,
            ],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var EcommerceModule = _classThis = class {
    };
    __setFunctionName(_classThis, "EcommerceModule");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        EcommerceModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return EcommerceModule = _classThis;
})();
exports.EcommerceModule = EcommerceModule;
