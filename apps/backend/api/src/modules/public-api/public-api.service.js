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
exports.PublicApiService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let PublicApiService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PublicApiService = _classThis = class {
        constructor(prisma, cache, webhookService, analyticsService) {
            this.prisma = prisma;
            this.cache = cache;
            this.webhookService = webhookService;
            this.analyticsService = analyticsService;
        }
        async getBrandInfo() {
            const cacheKey = 'brand:info';
            return this.cache.getOrSet(cacheKey, async () => {
                // Get brand info from request context (set by API key guard)
                const brandId = this.getCurrentBrandId();
                if (!brandId) {
                    throw new common_1.UnauthorizedException('Brand context not found');
                }
                const brand = await this.prisma.brand.findUnique({
                    where: { id: brandId },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true,
                        logo: true,
                        website: true,
                        status: true,
                        plan: true,
                        settings: true,
                    },
                });
                if (!brand) {
                    throw new common_1.NotFoundException('Brand not found');
                }
                return brand;
            }, 300); // Cache for 5 minutes
        }
        async getProducts(page = 1, limit = 10) {
            const brandId = this.getCurrentBrandId();
            const skip = (page - 1) * limit;
            const [products, total] = await Promise.all([
                this.prisma.product.findMany({
                    where: { brandId },
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        sku: true,
                        price: true,
                        currency: true,
                        images: true,
                        model3dUrl: true,
                        customizationOptions: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                this.prisma.product.count({ where: { brandId } }),
            ]);
            return {
                data: products,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        }
        async getProduct(id) {
            const brandId = this.getCurrentBrandId();
            const product = await this.prisma.product.findFirst({
                where: {
                    id,
                    brandId,
                    isActive: true,
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    sku: true,
                    price: true,
                    currency: true,
                    images: true,
                    model3dUrl: true,
                    modelConfig: true,
                    customizationOptions: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            if (!product) {
                throw new common_1.NotFoundException('Product not found');
            }
            return product;
        }
        async createDesign(createDesignDto) {
            const brandId = this.getCurrentBrandId();
            // Validate product exists and belongs to brand
            const product = await this.prisma.product.findFirst({
                where: {
                    id: createDesignDto.productId,
                    brandId,
                    isActive: true,
                },
            });
            if (!product) {
                throw new common_1.BadRequestException('Product not found or not accessible');
            }
            const design = await this.prisma.design.create({
                data: {
                    name: createDesignDto.name,
                    description: createDesignDto.description,
                    prompt: createDesignDto.prompt,
                    status: 'PENDING',
                    productId: createDesignDto.productId,
                    brandId,
                    options: createDesignDto.customizationData || {},
                    metadata: createDesignDto.metadata,
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            // Trigger webhook for design creation
            await this.webhookService.sendWebhook('design.created', {
                designId: design.id,
                brandId,
                status: design.status,
            });
            return design;
        }
        async getDesign(id) {
            const brandId = this.getCurrentBrandId();
            const design = await this.prisma.design.findFirst({
                where: {
                    id,
                    brandId,
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    prompt: true,
                    status: true,
                    highResUrl: true,
                    previewUrl: true,
                    metadata: true,
                    createdAt: true,
                    updatedAt: true,
                    product: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                        },
                    },
                },
            });
            if (!design) {
                throw new common_1.NotFoundException('Design not found');
            }
            return design;
        }
        async createOrder(createOrderDto) {
            const brandId = this.getCurrentBrandId();
            // Validate design exists and belongs to brand
            const design = await this.prisma.design.findFirst({
                where: {
                    id: createOrderDto.designId,
                    brandId,
                    status: 'COMPLETED',
                },
                include: {
                    product: true,
                },
            });
            if (!design) {
                throw new common_1.BadRequestException('Design not found or not completed');
            }
            const order = await this.prisma.order.create({
                data: {
                    orderNumber: crypto.randomBytes(8).toString('hex'),
                    status: 'CREATED',
                    totalCents: Math.round(Number(design.product.price) * 100),
                    subtotalCents: Math.round(Number(design.product.price) * 100),
                    currency: design.product.currency,
                    design: {
                        connect: { id: createOrderDto.designId }
                    },
                    brand: {
                        connect: { id: brandId }
                    },
                    product: {
                        connect: { id: design.productId }
                    },
                    customerEmail: createOrderDto.customerEmail,
                    customerName: createOrderDto.customerName,
                    shippingAddress: createOrderDto.shippingAddress,
                },
                select: {
                    id: true,
                    status: true,
                    totalCents: true,
                    currency: true,
                    createdAt: true,
                    design: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            // Trigger webhook for order creation
            await this.webhookService.sendWebhook('order.created', {
                orderId: order.id,
                brandId,
                status: order.status,
                totalAmount: order.totalCents / 100,
            });
            return order;
        }
        async getOrder(id) {
            const brandId = this.getCurrentBrandId();
            const order = await this.prisma.order.findFirst({
                where: {
                    id,
                    brandId,
                },
                select: {
                    id: true,
                    status: true,
                    totalCents: true,
                    currency: true,
                    customerEmail: true,
                    customerName: true,
                    shippingAddress: true,
                    createdAt: true,
                    updatedAt: true,
                    design: {
                        select: {
                            id: true,
                            name: true,
                            highResUrl: true,
                        },
                    },
                },
            });
            if (!order) {
                throw new common_1.NotFoundException('Order not found');
            }
            return order;
        }
        async getOrders(page = 1, limit = 10, status) {
            const brandId = this.getCurrentBrandId();
            const skip = (page - 1) * limit;
            const where = { brandId };
            if (status) {
                where.status = status;
            }
            const [orders, total] = await Promise.all([
                this.prisma.order.findMany({
                    where,
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        status: true,
                        totalCents: true,
                        currency: true,
                        customerEmail: true,
                        customerName: true,
                        createdAt: true,
                        design: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                this.prisma.order.count({ where }),
            ]);
            return {
                data: orders,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        }
        async getAnalytics(query) {
            const brandId = this.getCurrentBrandId();
            return this.analyticsService.getAnalytics(brandId, query);
        }
        async testWebhook(payload) {
            const brandId = this.getCurrentBrandId();
            return this.webhookService.sendWebhook('test', payload, brandId);
        }
        getCurrentBrandId() {
            // This would be set by the API key guard
            // For now, we'll extract it from the request context
            // In a real implementation, this would come from the authenticated API key
            return global.currentBrandId || null;
        }
    };
    __setFunctionName(_classThis, "PublicApiService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PublicApiService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PublicApiService = _classThis;
})();
exports.PublicApiService = PublicApiService;
