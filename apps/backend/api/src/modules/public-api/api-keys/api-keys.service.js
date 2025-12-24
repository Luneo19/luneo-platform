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
exports.ApiKeysService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const bcrypt = __importStar(require("bcrypt"));
const common_2 = require("@nestjs/common");
let ApiKeysService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ApiKeysService = _classThis = class {
        constructor(prisma, cache) {
            this.prisma = prisma;
            this.cache = cache;
            this.logger = new common_2.Logger(ApiKeysService.name);
        }
        /**
         * Safely converts Prisma Json rateLimit to ApiKey rateLimit type
         */
        parseRateLimit(rateLimit) {
            if (!rateLimit || typeof rateLimit !== 'object' || Array.isArray(rateLimit)) {
                return {
                    requestsPerMinute: 60,
                    requestsPerDay: 10000,
                    requestsPerMonth: 300000,
                };
            }
            const rl = rateLimit;
            return {
                requestsPerMinute: typeof rl.requestsPerMinute === 'number' ? rl.requestsPerMinute : 60,
                requestsPerDay: typeof rl.requestsPerDay === 'number' ? rl.requestsPerDay : 10000,
                requestsPerMonth: typeof rl.requestsPerMonth === 'number' ? rl.requestsPerMonth : 300000,
            };
        }
        /**
         * Créer une nouvelle API Key
         */
        async createApiKey(brandId, data) {
            const keyId = `luneo_${this.generateKeyId()}`;
            const secret = this.generateSecret();
            const hashedSecret = await bcrypt.hash(secret, 12);
            const apiKey = await this.prisma.apiKey.create({
                data: {
                    id: keyId,
                    name: data.name,
                    key: keyId,
                    secret: hashedSecret,
                    permissions: data.permissions,
                    rateLimit: data.rateLimit,
                    brandId,
                    isActive: true,
                },
                include: {
                    brand: {
                        select: { id: true, name: true }
                    }
                }
            });
            // Invalider le cache des API keys
            await this.cache.invalidate(`api-keys:${brandId}`, 'api');
            return {
                apiKey: {
                    id: apiKey.id,
                    name: apiKey.name,
                    key: apiKey.id,
                    permissions: apiKey.permissions,
                    rateLimit: apiKey.rateLimit,
                    brandId: apiKey.brandId,
                    isActive: apiKey.isActive,
                    createdAt: apiKey.createdAt,
                },
                secret,
            };
        }
        /**
         * Valider une API Key
         */
        async validateApiKey(key, secret) {
            const cacheKey = `api-key:${key}`;
            // Essayer de récupérer depuis le cache
            let apiKey = await this.cache.get(cacheKey, 'api', async () => {
                const keyData = await this.prisma.apiKey.findUnique({
                    where: { id: key, isActive: true },
                    include: {
                        brand: {
                            select: { id: true, name: true, status: true }
                        }
                    }
                });
                if (!keyData) {
                    throw new common_1.UnauthorizedException('Invalid API key');
                }
                // Vérifier que la brand est active
                if (keyData.brand.status !== 'ACTIVE') {
                    throw new common_1.UnauthorizedException('Brand is not active');
                }
                return {
                    id: keyData.id,
                    name: keyData.name,
                    permissions: keyData.permissions,
                    rateLimit: this.parseRateLimit(keyData.rateLimit),
                    brandId: keyData.brandId,
                    isActive: keyData.isActive,
                    createdAt: keyData.createdAt,
                    lastUsedAt: keyData.lastUsedAt,
                };
            }, { ttl: 3600 } // Cache 1 heure
            );
            // Vérifier le secret si fourni
            if (secret) {
                const keyData = await this.prisma.apiKey.findUnique({
                    where: { id: key },
                    select: { secret: true }
                });
                if (!keyData || !await bcrypt.compare(secret, keyData.secret)) {
                    throw new common_1.UnauthorizedException('Invalid API key secret');
                }
            }
            // Mettre à jour lastUsedAt
            await this.updateLastUsed(key);
            return {
                ...apiKey,
                key: apiKey.id, // Add the missing key field
            };
        }
        /**
         * Get API key by ID
         */
        async getApiKey(id, brandId) {
            const apiKey = await this.prisma.apiKey.findFirst({
                where: { id, brandId },
                include: {
                    brand: {
                        select: { id: true, name: true }
                    }
                }
            });
            if (!apiKey) {
                throw new common_1.NotFoundException('API key not found');
            }
            return {
                id: apiKey.id,
                name: apiKey.name,
                key: apiKey.id,
                permissions: apiKey.permissions,
                rateLimit: this.parseRateLimit(apiKey.rateLimit),
                brandId: apiKey.brandId,
                isActive: apiKey.isActive,
                createdAt: apiKey.createdAt,
                lastUsedAt: apiKey.lastUsedAt,
            };
        }
        /**
         * Update API key
         */
        async updateApiKey(id, brandId, data) {
            const updatedKey = await this.prisma.apiKey.update({
                where: { id, brandId },
                data: {
                    name: data.name,
                    permissions: data.permissions,
                    rateLimit: data.rateLimit,
                },
                include: {
                    brand: {
                        select: { id: true, name: true }
                    }
                }
            });
            return {
                id: updatedKey.id,
                name: updatedKey.name,
                key: updatedKey.id,
                permissions: updatedKey.permissions,
                rateLimit: this.parseRateLimit(updatedKey.rateLimit),
                brandId: updatedKey.brandId,
                isActive: updatedKey.isActive,
                createdAt: updatedKey.createdAt,
                lastUsedAt: updatedKey.lastUsedAt,
            };
        }
        /**
         * Delete API key
         */
        async deleteApiKey(id, brandId) {
            await this.prisma.apiKey.delete({
                where: { id, brandId },
            });
        }
        /**
         * Regenerate API key secret
         */
        async regenerateSecret(id, brandId) {
            const secret = this.generateSecret();
            const hashedSecret = await bcrypt.hash(secret, 12);
            await this.prisma.apiKey.update({
                where: { id, brandId },
                data: { secret: hashedSecret },
            });
            return { secret };
        }
        /**
         * Lister les API Keys d'une brand
         */
        async listApiKeys(brandId) {
            return this.cache.get(`api-keys:${brandId}`, 'api', async () => {
                const apiKeys = await this.prisma.apiKey.findMany({
                    where: { brandId, isActive: true },
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        name: true,
                        permissions: true,
                        rateLimit: true,
                        brandId: true,
                        isActive: true,
                        createdAt: true,
                        lastUsedAt: true,
                    }
                });
                return apiKeys.map(key => ({
                    id: key.id,
                    name: key.name,
                    key: key.id,
                    permissions: key.permissions,
                    rateLimit: this.parseRateLimit(key.rateLimit),
                    brandId: key.brandId,
                    isActive: key.isActive,
                    createdAt: key.createdAt,
                    lastUsedAt: key.lastUsedAt,
                }));
            }, { ttl: 1800 } // Cache 30 minutes
            );
        }
        /**
         * Désactiver une API Key
         */
        async deactivateApiKey(keyId, brandId) {
            const apiKey = await this.prisma.apiKey.findFirst({
                where: { id: keyId, brandId }
            });
            if (!apiKey) {
                throw new common_1.NotFoundException('API key not found');
            }
            await this.prisma.apiKey.update({
                where: { id: keyId },
                data: { isActive: false }
            });
            // Invalider le cache
            await this.cache.invalidate(`api-key:${keyId}`, 'api');
            await this.cache.invalidate(`api-keys:${brandId}`, 'api');
        }
        /**
         * Vérifier les permissions d'une API Key
         */
        async checkPermission(keyId, permission) {
            const apiKey = await this.validateApiKey(keyId);
            return apiKey.permissions.includes(permission) || apiKey.permissions.includes('*');
        }
        /**
         * Obtenir les statistiques d'utilisation d'une API Key
         */
        async getUsageStats(keyId, period = 'day') {
            const cacheKey = `api-key-stats:${keyId}:${period}`;
            return this.cache.get(cacheKey, 'analytics', async () => {
                // Implémentation des statistiques d'utilisation
                // À compléter selon les besoins de monitoring
                return {
                    requests: 0,
                    errors: 0,
                    rateLimitHits: 0,
                    period,
                };
            }, { ttl: 300 } // Cache 5 minutes
            );
        }
        /**
         * Générer un ID de clé unique
         */
        generateKeyId() {
            const timestamp = Date.now().toString(36);
            const random = crypto.randomBytes(4).toString('hex');
            return `${timestamp}_${random}`;
        }
        /**
         * Générer un secret sécurisé
         */
        generateSecret() {
            return crypto.randomBytes(32).toString('hex');
        }
        /**
         * Mettre à jour la dernière utilisation
         */
        async updateLastUsed(keyId) {
            // Mettre à jour en arrière-plan pour ne pas bloquer la requête
            setImmediate(async () => {
                try {
                    await this.prisma.apiKey.update({
                        where: { id: keyId },
                        data: { lastUsedAt: new Date() }
                    });
                }
                catch (error) {
                    this.logger.error('Failed to update last used timestamp:', error);
                }
            });
        }
    };
    __setFunctionName(_classThis, "ApiKeysService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ApiKeysService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ApiKeysService = _classThis;
})();
exports.ApiKeysService = ApiKeysService;
