"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const cacheable_decorator_1 = require("@/libs/cache/cacheable.decorator");
let OrdersService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _findOne_decorators;
    var OrdersService = _classThis = class {
        constructor(prisma, configService) {
            this.prisma = (__runInitializers(this, _instanceExtraInitializers), prisma);
            this.configService = configService;
            this.stripeInstance = null;
            this.stripeModule = null;
        }
        /**
         * Lazy load Stripe module to reduce cold start time
         */
        async getStripe() {
            if (!this.stripeInstance) {
                if (!this.stripeModule) {
                    this.stripeModule = await Promise.resolve().then(() => __importStar(require('stripe')));
                }
                this.stripeInstance = new this.stripeModule.default(this.configService.get('stripe.secretKey'), {
                    apiVersion: '2023-10-16',
                });
            }
            return this.stripeInstance;
        }
        async create(createOrderDto, currentUser) {
            const designId = createOrderDto.designId;
            const customerEmail = createOrderDto.customerEmail;
            const customerName = createOrderDto.customerName;
            const customerPhone = createOrderDto.customerPhone;
            const shippingAddress = createOrderDto.shippingAddress;
            // Optimisé: select au lieu de include
            // Get design and check permissions
            const design = await this.prisma.design.findUnique({
                where: { id: designId },
                select: {
                    id: true,
                    prompt: true,
                    brandId: true,
                    productId: true,
                    product: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                        },
                    },
                    brand: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            if (!design) {
                throw new common_1.NotFoundException('Design not found');
            }
            if (currentUser.role !== client_1.UserRole.PLATFORM_ADMIN &&
                currentUser.brandId !== design.brandId) {
                throw new common_1.ForbiddenException('Access denied to this design');
            }
            // Calculate pricing
            const product = design.product;
            const subtotalCents = Math.round(parseFloat(product.price.toString()) * 100);
            const taxCents = Math.round(subtotalCents * 0.20); // 20% VAT
            const shippingCents = 0; // Free shipping for now
            const totalCents = subtotalCents + taxCents + shippingCents;
            // Optimisé: select au lieu de include
            // Create order
            const order = await this.prisma.order.create({
                data: {
                    orderNumber: this.generateOrderNumber(),
                    customerEmail,
                    customerName,
                    customerPhone,
                    shippingAddress,
                    subtotalCents,
                    taxCents,
                    shippingCents,
                    totalCents,
                    userId: currentUser.id,
                    brandId: design.brandId,
                    designId,
                    productId: design.productId,
                },
                select: {
                    id: true,
                    orderNumber: true,
                    customerEmail: true,
                    customerName: true,
                    customerPhone: true,
                    shippingAddress: true,
                    subtotalCents: true,
                    taxCents: true,
                    shippingCents: true,
                    totalCents: true,
                    status: true,
                    paymentStatus: true,
                    userId: true,
                    brandId: true,
                    designId: true,
                    productId: true,
                    createdAt: true,
                    design: {
                        select: {
                            id: true,
                            prompt: true,
                            previewUrl: true,
                        },
                    },
                    product: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                        },
                    },
                    brand: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            // Create Stripe checkout session
            const stripe = await this.getStripe();
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'eur',
                            product_data: {
                                name: design.product.name,
                                description: `Design personnalisé: ${design.prompt}`,
                            },
                            unit_amount: totalCents,
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${this.configService.get('app.frontendUrl')}/orders/${order.id}/success`,
                cancel_url: `${this.configService.get('app.frontendUrl')}/orders/${order.id}/cancel`,
                metadata: {
                    orderId: order.id,
                },
            });
            // Update order with session ID
            await this.prisma.order.update({
                where: { id: order.id },
                data: { stripeSessionId: session.id },
            });
            return {
                ...order,
                checkoutUrl: session.url,
            };
        }
        // Optimisé: select au lieu de include, cache automatique
        async findOne(id, currentUser) {
            const order = await this.prisma.order.findUnique({
                where: { id },
                select: {
                    id: true,
                    orderNumber: true,
                    customerEmail: true,
                    customerName: true,
                    customerPhone: true,
                    shippingAddress: true,
                    subtotalCents: true,
                    taxCents: true,
                    shippingCents: true,
                    totalCents: true,
                    status: true,
                    paymentStatus: true,
                    stripeSessionId: true,
                    userId: true,
                    brandId: true,
                    designId: true,
                    productId: true,
                    createdAt: true,
                    updatedAt: true,
                    design: {
                        select: {
                            id: true,
                            prompt: true,
                            previewUrl: true,
                        },
                    },
                    product: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            description: true,
                        },
                    },
                    brand: {
                        select: {
                            id: true,
                            name: true,
                            logo: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });
            if (!order) {
                throw new common_1.NotFoundException('Order not found');
            }
            // Check permissions
            if (currentUser.role !== client_1.UserRole.PLATFORM_ADMIN &&
                currentUser.brandId !== order.brandId) {
                throw new common_1.ForbiddenException('Access denied to this order');
            }
            return order;
        }
        async cancel(id, currentUser) {
            const order = await this.findOne(id, currentUser);
            if (order.status !== client_1.OrderStatus.CREATED) {
                throw new common_1.ForbiddenException('Order cannot be cancelled');
            }
            return this.prisma.order.update({
                where: { id },
                data: {
                    status: client_1.OrderStatus.CANCELLED,
                    paymentStatus: client_1.PaymentStatus.CANCELLED,
                },
            });
        }
        generateOrderNumber() {
            return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        }
    };
    __setFunctionName(_classThis, "OrdersService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _findOne_decorators = [(0, cacheable_decorator_1.Cacheable)({
                type: 'order',
                ttl: 1800,
                keyGenerator: (args) => `order:${args[0]}`,
                tags: () => ['orders:list'],
            })];
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OrdersService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OrdersService = _classThis;
})();
exports.OrdersService = OrdersService;
