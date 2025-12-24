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
exports.OAuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@/common/guards/jwt-auth.guard");
let OAuthController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('OAuth'), (0, common_1.Controller)('oauth'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _authorize_decorators;
    let _token_decorators;
    let _refresh_decorators;
    let _revoke_decorators;
    let _getConfig_decorators;
    let _validate_decorators;
    var OAuthController = _classThis = class {
        constructor(oauthService) {
            this.oauthService = (__runInitializers(this, _instanceExtraInitializers), oauthService);
        }
        async authorize(redirectUri, scopes) {
            const brandId = this.getCurrentBrandId();
            const scopeArray = scopes ? scopes.split(',').map(s => s.trim()) : [];
            return this.oauthService.generateAuthUrl(brandId, redirectUri, scopeArray);
        }
        async token(code, state) {
            return this.oauthService.exchangeCodeForToken(code, state);
        }
        async refresh(refreshToken) {
            return this.oauthService.refreshAccessToken(refreshToken);
        }
        async revoke(token) {
            await this.oauthService.revokeAccessToken(token);
        }
        async getConfig() {
            const brandId = this.getCurrentBrandId();
            return this.oauthService.getClientConfig(brandId);
        }
        async validate(token) {
            return this.oauthService.validateAccessToken(token);
        }
        getCurrentBrandId() {
            // This would be extracted from the authenticated user context
            return global.currentBrandId || 'default-brand-id';
        }
    };
    __setFunctionName(_classThis, "OAuthController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _authorize_decorators = [(0, common_1.Get)('authorize'), (0, swagger_1.ApiOperation)({ summary: 'Generate OAuth authorization URL' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Authorization URL generated successfully' }), (0, swagger_1.ApiQuery)({ name: 'redirect_uri', description: 'Redirect URI after authorization' }), (0, swagger_1.ApiQuery)({ name: 'scopes', description: 'Requested scopes (comma-separated)', required: false })];
        _token_decorators = [(0, common_1.Post)('token'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Exchange authorization code for access token' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Token exchanged successfully' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid authorization code or state' })];
        _refresh_decorators = [(0, common_1.Post)('refresh'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Refresh access token using refresh token' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Token refreshed successfully' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid refresh token' })];
        _revoke_decorators = [(0, common_1.Post)('revoke'), (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT), (0, swagger_1.ApiOperation)({ summary: 'Revoke access token' }), (0, swagger_1.ApiResponse)({ status: 204, description: 'Token revoked successfully' })];
        _getConfig_decorators = [(0, common_1.Get)('config'), (0, swagger_1.ApiOperation)({ summary: 'Get OAuth client configuration' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Client configuration retrieved successfully' })];
        _validate_decorators = [(0, common_1.Get)('validate'), (0, swagger_1.ApiOperation)({ summary: 'Validate access token' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Token is valid' }), (0, swagger_1.ApiResponse)({ status: 401, description: 'Token is invalid or expired' }), (0, swagger_1.ApiQuery)({ name: 'token', description: 'Access token to validate' })];
        __esDecorate(_classThis, null, _authorize_decorators, { kind: "method", name: "authorize", static: false, private: false, access: { has: obj => "authorize" in obj, get: obj => obj.authorize }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _token_decorators, { kind: "method", name: "token", static: false, private: false, access: { has: obj => "token" in obj, get: obj => obj.token }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _refresh_decorators, { kind: "method", name: "refresh", static: false, private: false, access: { has: obj => "refresh" in obj, get: obj => obj.refresh }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _revoke_decorators, { kind: "method", name: "revoke", static: false, private: false, access: { has: obj => "revoke" in obj, get: obj => obj.revoke }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getConfig_decorators, { kind: "method", name: "getConfig", static: false, private: false, access: { has: obj => "getConfig" in obj, get: obj => obj.getConfig }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _validate_decorators, { kind: "method", name: "validate", static: false, private: false, access: { has: obj => "validate" in obj, get: obj => obj.validate }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OAuthController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OAuthController = _classThis;
})();
exports.OAuthController = OAuthController;
