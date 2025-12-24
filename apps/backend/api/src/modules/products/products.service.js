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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const pagination_helper_1 = require("@/libs/prisma/pagination.helper");
const cacheable_decorator_1 = require("@/libs/cache/cacheable.decorator");
const app_error_1 = require("@/common/errors/app-error");
let ProductsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _findAll_decorators;
    let _findOne_decorators;
    let _create_decorators;
    let _update_decorators;
    let _remove_decorators;
    var ProductsService = _classThis = class {
        constructor(prisma) {
            this.prisma = (__runInitializers(this, _instanceExtraInitializers), prisma);
        }
        // Optimisé: select au lieu de include, pagination ajoutée, cache automatique
        async findAll(query = {}, pagination = {}) {
            const { brandId, isPublic, isActive } = query;
            const { skip, take, page, limit } = (0, pagination_helper_1.normalizePagination)(pagination);
            const [data, total] = await Promise.all([
                this.prisma.product.findMany({
                    where: {
                        ...(brandId && { brandId }),
                        ...(isPublic !== undefined && { isPublic }),
                        ...(isActive !== undefined && { isActive }),
                    },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        price: true,
                        isPublic: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                        brandId: true,
                        brand: {
                            select: {
                                id: true,
                                name: true,
                                logo: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take,
                }),
                this.prisma.product.count({
                    where: {
                        ...(brandId && { brandId }),
                        ...(isPublic !== undefined && { isPublic }),
                        ...(isActive !== undefined && { isActive }),
                    },
                }),
            ]);
            return (0, pagination_helper_1.createPaginationResult)(data, total, { page, limit });
        }
        // Optimisé: select au lieu de include, cache automatique
        async findOne(id) {
            const product = await this.prisma.product.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    isPublic: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    brandId: true,
                    brand: {
                        select: {
                            id: true,
                            name: true,
                            logo: true,
                            website: true,
                        },
                    },
                },
            });
            if (!product) {
                throw app_error_1.AppErrorFactory.notFound('Product', id);
            }
            return product;
        }
        async create(brandId, createProductDto, currentUser) {
            // Check if user has access to this brand
            if (currentUser.role !== client_1.UserRole.PLATFORM_ADMIN &&
                currentUser.brandId !== brandId) {
                throw app_error_1.AppErrorFactory.insufficientPermissions('access brand resource', { brandId });
            }
            // Optimisé: select au lieu de include
            return this.prisma.product.create({
                data: {
                    ...createProductDto,
                    brandId,
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    isPublic: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    brandId: true,
                    brand: {
                        select: {
                            id: true,
                            name: true,
                            logo: true,
                        },
                    },
                },
            });
        }
        async update(brandId, id, updateProductDto, currentUser) {
            // Check if user has access to this brand
            if (currentUser.role !== client_1.UserRole.PLATFORM_ADMIN &&
                currentUser.brandId !== brandId) {
                throw app_error_1.AppErrorFactory.insufficientPermissions('access brand resource', { brandId });
            }
            // Optimisé: select au lieu de include
            return this.prisma.product.update({
                where: { id },
                data: updateProductDto,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    isPublic: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    brandId: true,
                    brand: {
                        select: {
                            id: true,
                            name: true,
                            logo: true,
                        },
                    },
                },
            });
        }
        async remove(id, brandId, currentUser) {
            // Check if user has access to this brand
            if (currentUser.role !== client_1.UserRole.PLATFORM_ADMIN &&
                currentUser.brandId !== brandId) {
                throw app_error_1.AppErrorFactory.insufficientPermissions('access brand resource', { brandId });
            }
            // Verify product exists and belongs to brand
            const product = await this.prisma.product.findUnique({
                where: { id },
                select: { id: true, brandId: true },
            });
            if (!product) {
                throw app_error_1.AppErrorFactory.notFound('Product', id);
            }
            if (product.brandId !== brandId) {
                throw app_error_1.AppErrorFactory.insufficientPermissions('access brand resource', { brandId });
            }
            // Delete product
            return this.prisma.product.delete({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    brandId: true,
                },
            });
        }
    };
    __setFunctionName(_classThis, "ProductsService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _findAll_decorators = [(0, cacheable_decorator_1.Cacheable)({
                type: 'product',
                ttl: 3600,
                keyGenerator: (args) => `products:findAll:${JSON.stringify(args[0])}:${JSON.stringify(args[1])}`,
                tags: (args) => ['products:list', args[0]?.brandId ? `brand:${args[0].brandId}` : null].filter(Boolean),
            })];
        _findOne_decorators = [(0, cacheable_decorator_1.Cacheable)({
                type: 'product',
                ttl: 7200,
                keyGenerator: (args) => `product:${args[0]}`,
                tags: () => ['products:list'],
            })];
        _create_decorators = [(0, cacheable_decorator_1.CacheInvalidate)({
                type: 'product',
                tags: (args) => ['products:list', `brand:${args[0]}`],
            })];
        _update_decorators = [(0, cacheable_decorator_1.CacheInvalidate)({
                type: 'product',
                pattern: (args) => `product:${args[1]}`,
                tags: (args) => ['products:list', `brand:${args[0]}`],
            })];
        _remove_decorators = [(0, cacheable_decorator_1.CacheInvalidate)({
                type: 'product',
                pattern: (args) => `product:${args[0]}`,
                tags: (args) => ['products:list', `brand:${args[1]}`],
            })];
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: obj => "remove" in obj, get: obj => obj.remove }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ProductsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ProductsService = _classThis;
})();
exports.ProductsService = ProductsService;
