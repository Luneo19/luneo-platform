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
exports.OAuthService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let OAuthService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OAuthService = _classThis = class {
        constructor(prisma, cache) {
            this.prisma = prisma;
            this.cache = cache;
        }
        /**
         * Generate OAuth authorization URL
         */
        async generateAuthUrl(brandId, redirectUri, scopes = []) {
            const state = crypto.randomBytes(32).toString('hex');
            const cacheKey = `oauth:state:${state}`;
            // Store state with brand context
            await this.cache.setSimple(cacheKey, JSON.stringify({
                brandId,
                redirectUri,
                scopes,
                createdAt: new Date().toISOString(),
            }), 600); // 10 minutes TTL
            // In a real implementation, this would generate the actual OAuth URL
            const authUrl = `${process.env.OAUTH_BASE_URL || 'https://oauth.luneo.app'}/authorize?` +
                `client_id=${process.env.OAUTH_CLIENT_ID}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `scope=${scopes.join(' ')}&` +
                `state=${state}&` +
                `response_type=code`;
            return { authUrl, state };
        }
        /**
         * Exchange authorization code for access token
         */
        async exchangeCodeForToken(code, state) {
            // Verify state
            const stateDataStr = await this.cache.getSimple(`oauth:state:${state}`);
            if (!stateDataStr) {
                throw new common_1.UnauthorizedException('Invalid or expired state');
            }
            const stateData = JSON.parse(stateDataStr);
            // In a real implementation, this would make a request to the OAuth provider
            // For now, we'll simulate the token exchange
            const accessToken = crypto.randomBytes(32).toString('hex');
            const refreshToken = crypto.randomBytes(32).toString('hex');
            const expiresIn = 3600; // 1 hour
            // Store tokens
            await this.cache.setSimple(`oauth:access_token:${accessToken}`, JSON.stringify({
                brandId: stateData.brandId,
                scopes: stateData.scopes,
                expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
            }), expiresIn);
            await this.cache.setSimple(`oauth:refresh_token:${refreshToken}`, JSON.stringify({
                brandId: stateData.brandId,
                accessToken,
            }), 86400 * 30); // 30 days
            // Clean up state
            await this.cache.delSimple(`oauth:state:${state}`);
            return { accessToken, refreshToken, expiresIn };
        }
        /**
         * Validate access token
         */
        async validateAccessToken(token) {
            const tokenDataStr = await this.cache.getSimple(`oauth:access_token:${token}`);
            if (!tokenDataStr) {
                throw new common_1.UnauthorizedException('Invalid or expired access token');
            }
            const tokenData = JSON.parse(tokenDataStr);
            return {
                brandId: tokenData.brandId,
                scopes: tokenData.scopes,
            };
        }
        /**
         * Refresh access token
         */
        async refreshAccessToken(refreshToken) {
            const refreshDataStr = await this.cache.getSimple(`oauth:refresh_token:${refreshToken}`);
            if (!refreshDataStr) {
                throw new common_1.UnauthorizedException('Invalid or expired refresh token');
            }
            const refreshData = JSON.parse(refreshDataStr);
            // Generate new access token
            const newAccessToken = crypto.randomBytes(32).toString('hex');
            const expiresIn = 3600; // 1 hour
            // Store new access token
            await this.cache.setSimple(`oauth:access_token:${newAccessToken}`, JSON.stringify({
                brandId: refreshData.brandId,
                scopes: [], // In real implementation, get from original token
                expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
            }), expiresIn);
            return { accessToken: newAccessToken, expiresIn };
        }
        /**
         * Revoke access token
         */
        async revokeAccessToken(token) {
            const tokenDataStr = await this.cache.getSimple(`oauth:access_token:${token}`);
            if (tokenDataStr) {
                await this.cache.delSimple(`oauth:access_token:${token}`);
                // Also revoke associated refresh token if exists
                // In a real implementation, you'd need to track this relationship
            }
        }
        /**
         * Get OAuth client configuration
         */
        async getClientConfig(brandId) {
            // In a real implementation, this would come from the database
            return {
                clientId: process.env.OAUTH_CLIENT_ID || 'luneo-client',
                redirectUris: [
                    'https://app.luneo.app/auth/callback',
                    'http://localhost:3000/auth/callback',
                ],
                scopes: [
                    'designs:read',
                    'designs:write',
                    'orders:read',
                    'orders:write',
                    'analytics:read',
                ],
            };
        }
    };
    __setFunctionName(_classThis, "OAuthService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OAuthService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OAuthService = _classThis;
})();
exports.OAuthService = OAuthService;
