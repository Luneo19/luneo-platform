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
exports.BrandsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let BrandsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var BrandsService = _classThis = class {
        constructor(prisma, cache) {
            this.prisma = prisma;
            this.cache = cache;
        }
        async create(createBrandDto, userId) {
            const user = await this.cache.get(`user:${userId}`, 'user', () => this.prisma.user.findUnique({
                where: { id: userId },
            }));
            if (!user || (user.role !== client_1.UserRole.BRAND_ADMIN && user.role !== client_1.UserRole.PLATFORM_ADMIN)) {
                throw new common_1.ForbiddenException('Only brand admins can create brands');
            }
            const brand = await this.prisma.brand.create({
                data: {
                    ...createBrandDto,
                    users: {
                        connect: { id: userId },
                    },
                },
                include: {
                    users: true,
                },
            });
            // Invalider le cache des brands après création
            await this.cache.invalidate('brands:list', 'brand');
            return brand;
        }
        async findOne(id, currentUser) {
            // Vérifier les permissions d'abord (rapide)
            if (currentUser.role !== client_1.UserRole.PLATFORM_ADMIN &&
                currentUser.brandId !== id) {
                throw new common_1.ForbiddenException('Access denied to this brand');
            }
            // Utiliser le cache intelligent pour récupérer la brand
            const brand = await this.cache.get(`brand:${id}`, 'brand', () => this.prisma.brand.findUnique({
                where: { id },
                include: {
                    users: true,
                    products: true,
                },
            }), { tags: [`brand:${id}`, 'brands:list'] });
            if (!brand) {
                throw new common_1.NotFoundException('Brand not found');
            }
            return brand;
        }
        async update(id, updateBrandDto, currentUser) {
            // Check permissions
            if (currentUser.role !== client_1.UserRole.PLATFORM_ADMIN &&
                currentUser.brandId !== id) {
                throw new common_1.ForbiddenException('Access denied to this brand');
            }
            const brand = await this.prisma.brand.update({
                where: { id },
                data: updateBrandDto,
                include: {
                    users: true,
                },
            });
            // Invalider le cache après mise à jour
            await this.cache.invalidate(`brand:${id}`, 'brand');
            return brand;
        }
        async addWebhook(brandId, webhookData, currentUser) {
            // Check permissions
            if (currentUser.role !== client_1.UserRole.PLATFORM_ADMIN &&
                currentUser.brandId !== brandId) {
                throw new common_1.ForbiddenException('Access denied to this brand');
            }
            const webhook = await this.prisma.webhook.create({
                data: {
                    ...webhookData,
                    brandId,
                },
            });
            // Invalider le cache des webhooks de la brand
            await this.cache.invalidate(`webhooks:${brandId}`, 'brand');
            return webhook;
        }
        /**
         * Récupérer toutes les brands avec cache
         */
        async findAll(page = 1, limit = 20, filters = {}) {
            const cacheKey = `brands:list:${page}:${limit}:${JSON.stringify(filters)}`;
            return this.cache.get(cacheKey, 'brand', () => this.prisma.brand.findMany({
                where: filters,
                select: {
                    id: true,
                    name: true,
                    logo: true,
                    website: true,
                    description: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    users: {
                        select: { id: true, firstName: true, lastName: true, email: true }
                    },
                    _count: {
                        select: {
                            products: true,
                            designs: true,
                            orders: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }), { ttl: 1800, tags: ['brands:list'] });
        }
        /**
         * Statistiques d'une brand avec cache
         */
        async getBrandStats(brandId, currentUser) {
            // Check permissions
            if (currentUser.role !== client_1.UserRole.PLATFORM_ADMIN &&
                currentUser.brandId !== brandId) {
                throw new common_1.ForbiddenException('Access denied to this brand');
            }
            return this.cache.get(`brand:${brandId}:stats`, 'analytics', () => this.prisma.getDashboardMetrics(brandId), { ttl: 300, tags: [`brand:${brandId}`] });
        }
        /**
         * Recherche de brands avec cache
         */
        async searchBrands(query, limit = 10) {
            const cacheKey = `brands:search:${query}:${limit}`;
            return this.cache.get(cacheKey, 'brand', () => this.prisma.brand.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        { website: { contains: query, mode: 'insensitive' } }
                    ],
                    status: client_1.BrandStatus.ACTIVE
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    logo: true,
                    website: true,
                    status: true
                },
                take: limit,
                orderBy: { name: 'asc' }
            }), { ttl: 600, tags: ['brands:search'] });
        }
    };
    __setFunctionName(_classThis, "BrandsService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BrandsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BrandsService = _classThis;
})();
exports.BrandsService = BrandsService;
