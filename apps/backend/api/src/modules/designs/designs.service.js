"use strict";
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const cacheable_decorator_1 = require("@/libs/cache/cacheable.decorator");
let DesignsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _findOne_decorators;
    var DesignsService = _classThis = class {
        constructor(prisma, aiQueue) {
            this.prisma = (__runInitializers(this, _instanceExtraInitializers), prisma);
            this.aiQueue = aiQueue;
        }
        async create(createDesignDto, currentUser) {
            const { productId, prompt, options } = createDesignDto;
            // Optimisé: select au lieu de include
            // Check if product exists and user has access
            const product = await this.prisma.product.findUnique({
                where: { id: productId },
                select: {
                    id: true,
                    brandId: true,
                    brand: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            if (!product) {
                throw new common_1.NotFoundException('Product not found');
            }
            if (currentUser.role !== client_1.UserRole.PLATFORM_ADMIN &&
                currentUser.brandId !== product.brandId) {
                throw new common_1.ForbiddenException('Access denied to this product');
            }
            // Optimisé: select au lieu de include
            // Create design record (cache invalidé automatiquement)
            const design = await this.prisma.design.create({
                data: {
                    prompt,
                    options: options,
                    status: client_1.DesignStatus.PENDING,
                    userId: currentUser.id,
                    brandId: product.brandId,
                    productId,
                },
                select: {
                    id: true,
                    prompt: true,
                    options: true,
                    status: true,
                    userId: true,
                    brandId: true,
                    productId: true,
                    createdAt: true,
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
            // Add to AI generation queue
            await this.aiQueue.add('generate-design', {
                designId: design.id,
                prompt,
                options,
                userId: currentUser.id,
                brandId: product.brandId,
            });
            return design;
        }
        // Optimisé: select au lieu de include, cache automatique
        async findOne(id, currentUser) {
            const design = await this.prisma.design.findUnique({
                where: { id },
                select: {
                    id: true,
                    prompt: true,
                    options: true,
                    status: true,
                    previewUrl: true,
                    highResUrl: true,
                    userId: true,
                    brandId: true,
                    productId: true,
                    createdAt: true,
                    updatedAt: true,
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
            if (!design) {
                throw new common_1.NotFoundException('Design not found');
            }
            // Check permissions
            if (currentUser.role !== client_1.UserRole.PLATFORM_ADMIN &&
                currentUser.brandId !== design.brandId) {
                throw new common_1.ForbiddenException('Access denied to this design');
            }
            return design;
        }
        async upgradeToHighRes(id, currentUser) {
            const design = await this.findOne(id, currentUser);
            if (design.status !== client_1.DesignStatus.COMPLETED) {
                throw new common_1.ForbiddenException('Design must be completed to upgrade to high-res');
            }
            // Add to high-res generation queue
            await this.aiQueue.add('generate-high-res', {
                designId: design.id,
                prompt: design.prompt,
                options: design.options,
                userId: currentUser.id,
            });
            return { message: 'High-res generation started' };
        }
    };
    __setFunctionName(_classThis, "DesignsService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _findOne_decorators = [(0, cacheable_decorator_1.Cacheable)({
                type: 'design',
                ttl: 900,
                keyGenerator: (args) => `design:${args[0]}`,
                tags: () => ['designs:list'],
            })];
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DesignsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DesignsService = _classThis;
})();
exports.DesignsService = DesignsService;
