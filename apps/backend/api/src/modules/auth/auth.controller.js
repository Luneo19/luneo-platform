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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@/common/guards/jwt-auth.guard");
let AuthController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('auth'), (0, common_1.Controller)('auth')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _signup_decorators;
    let _login_decorators;
    let _refreshToken_decorators;
    let _logout_decorators;
    let _getProfile_decorators;
    var AuthController = _classThis = class {
        constructor(authService) {
            this.authService = (__runInitializers(this, _instanceExtraInitializers), authService);
        }
        async signup(signupDto) {
            return this.authService.signup(signupDto);
        }
        async login(loginDto) {
            return this.authService.login(loginDto);
        }
        async refreshToken(refreshTokenDto) {
            return this.authService.refreshToken(refreshTokenDto);
        }
        async logout(req) {
            return this.authService.logout(req.user.id);
        }
        async getProfile(req) {
            return req.user;
        }
    };
    __setFunctionName(_classThis, "AuthController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _signup_decorators = [(0, common_1.Post)('signup'), (0, jwt_auth_guard_1.Public)(), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({ summary: 'Inscription d\'un nouvel utilisateur' }), (0, swagger_1.ApiResponse)({
                status: 201,
                description: 'Utilisateur créé avec succès',
                schema: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                user: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        email: { type: 'string' },
                                        firstName: { type: 'string' },
                                        lastName: { type: 'string' },
                                        role: { type: 'string' },
                                    },
                                },
                                accessToken: { type: 'string' },
                                refreshToken: { type: 'string' },
                            },
                        },
                        timestamp: { type: 'string' },
                    },
                },
            }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Données invalides' }), (0, swagger_1.ApiResponse)({ status: 409, description: 'Utilisateur déjà existant' })];
        _login_decorators = [(0, common_1.Post)('login'), (0, jwt_auth_guard_1.Public)(), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Connexion utilisateur' }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Connexion réussie',
                schema: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                user: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        email: { type: 'string' },
                                        firstName: { type: 'string' },
                                        lastName: { type: 'string' },
                                        role: { type: 'string' },
                                    },
                                },
                                accessToken: { type: 'string' },
                                refreshToken: { type: 'string' },
                            },
                        },
                        timestamp: { type: 'string' },
                    },
                },
            }), (0, swagger_1.ApiResponse)({ status: 401, description: 'Identifiants invalides' })];
        _refreshToken_decorators = [(0, common_1.Post)('refresh'), (0, jwt_auth_guard_1.Public)(), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Rafraîchir le token d\'accès' }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Token rafraîchi avec succès',
                schema: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                user: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        email: { type: 'string' },
                                        firstName: { type: 'string' },
                                        lastName: { type: 'string' },
                                        role: { type: 'string' },
                                    },
                                },
                                accessToken: { type: 'string' },
                                refreshToken: { type: 'string' },
                            },
                        },
                        timestamp: { type: 'string' },
                    },
                },
            }), (0, swagger_1.ApiResponse)({ status: 401, description: 'Refresh token invalide' })];
        _logout_decorators = [(0, common_1.Post)('logout'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Déconnexion utilisateur' }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Déconnexion réussie',
                schema: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                message: { type: 'string' },
                            },
                        },
                        timestamp: { type: 'string' },
                    },
                },
            })];
        _getProfile_decorators = [(0, common_1.Get)('me'), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Obtenir les informations de l\'utilisateur connecté' }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Informations utilisateur',
                schema: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                email: { type: 'string' },
                                firstName: { type: 'string' },
                                lastName: { type: 'string' },
                                role: { type: 'string' },
                                brandId: { type: 'string' },
                                brand: { type: 'object' },
                            },
                        },
                        timestamp: { type: 'string' },
                    },
                },
            }), (0, swagger_1.ApiResponse)({ status: 401, description: 'Non autorisé' })];
        __esDecorate(_classThis, null, _signup_decorators, { kind: "method", name: "signup", static: false, private: false, access: { has: obj => "signup" in obj, get: obj => obj.signup }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _login_decorators, { kind: "method", name: "login", static: false, private: false, access: { has: obj => "login" in obj, get: obj => obj.login }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _refreshToken_decorators, { kind: "method", name: "refreshToken", static: false, private: false, access: { has: obj => "refreshToken" in obj, get: obj => obj.refreshToken }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _logout_decorators, { kind: "method", name: "logout", static: false, private: false, access: { has: obj => "logout" in obj, get: obj => obj.logout }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getProfile_decorators, { kind: "method", name: "getProfile", static: false, private: false, access: { has: obj => "getProfile" in obj, get: obj => obj.getProfile }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuthController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuthController = _classThis;
})();
exports.AuthController = AuthController;
