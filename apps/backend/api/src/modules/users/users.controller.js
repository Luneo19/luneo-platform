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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_guard_1 = require("@/common/guards/roles.guard");
const client_1 = require("@prisma/client");
let UsersController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('users'), (0, common_1.Controller)('users'), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getProfile_decorators;
    let _updateProfile_decorators;
    let _getUserQuota_decorators;
    let _findOne_decorators;
    var UsersController = _classThis = class {
        constructor(usersService) {
            this.usersService = (__runInitializers(this, _instanceExtraInitializers), usersService);
        }
        async getProfile(req) {
            return this.usersService.findOne(req.user.id, req.user);
        }
        async updateProfile(req, updateProfileDto) {
            return this.usersService.updateProfile(req.user.id, updateProfileDto);
        }
        async getUserQuota(req) {
            return this.usersService.getUserQuota(req.user.id);
        }
        async findOne(id, req) {
            return this.usersService.findOne(id, req.user);
        }
    };
    __setFunctionName(_classThis, "UsersController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getProfile_decorators = [(0, common_1.Get)('me'), (0, swagger_1.ApiOperation)({ summary: 'Obtenir le profil de l\'utilisateur connecté' }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Profil utilisateur',
            })];
        _updateProfile_decorators = [(0, common_1.Patch)('me'), (0, swagger_1.ApiOperation)({ summary: 'Mettre à jour le profil utilisateur' }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Profil mis à jour',
            })];
        _getUserQuota_decorators = [(0, common_1.Get)('me/quota'), (0, swagger_1.ApiOperation)({ summary: 'Obtenir le quota de l\'utilisateur' }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Quota utilisateur',
            })];
        _findOne_decorators = [(0, common_1.Get)(':id'), (0, roles_guard_1.Roles)(client_1.UserRole.PLATFORM_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Obtenir un utilisateur par ID (Admin seulement)' }), (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de l\'utilisateur' }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Utilisateur trouvé',
            }), (0, swagger_1.ApiResponse)({ status: 403, description: 'Accès refusé' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Utilisateur non trouvé' })];
        __esDecorate(_classThis, null, _getProfile_decorators, { kind: "method", name: "getProfile", static: false, private: false, access: { has: obj => "getProfile" in obj, get: obj => obj.getProfile }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateProfile_decorators, { kind: "method", name: "updateProfile", static: false, private: false, access: { has: obj => "updateProfile" in obj, get: obj => obj.updateProfile }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUserQuota_decorators, { kind: "method", name: "getUserQuota", static: false, private: false, access: { has: obj => "getUserQuota" in obj, get: obj => obj.getUserQuota }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsersController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsersController = _classThis;
})();
exports.UsersController = UsersController;
