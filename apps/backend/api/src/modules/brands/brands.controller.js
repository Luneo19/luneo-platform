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
exports.BrandsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_guard_1 = require("@/common/guards/roles.guard");
const client_1 = require("@prisma/client");
let BrandsController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('brands'), (0, common_1.Controller)('brands'), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _create_decorators;
    let _findOne_decorators;
    let _update_decorators;
    let _addWebhook_decorators;
    var BrandsController = _classThis = class {
        constructor(brandsService) {
            this.brandsService = (__runInitializers(this, _instanceExtraInitializers), brandsService);
        }
        async create(createBrandDto, req) {
            return this.brandsService.create(createBrandDto, req.user.id);
        }
        async findOne(id, req) {
            return this.brandsService.findOne(id, req.user);
        }
        async update(id, updateBrandDto, req) {
            return this.brandsService.update(id, updateBrandDto, req.user);
        }
        async addWebhook(id, webhookData, req) {
            return this.brandsService.addWebhook(id, webhookData, req.user);
        }
    };
    __setFunctionName(_classThis, "BrandsController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)(), (0, roles_guard_1.Roles)(client_1.UserRole.BRAND_ADMIN, client_1.UserRole.PLATFORM_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Créer une nouvelle marque' }), (0, swagger_1.ApiResponse)({
                status: 201,
                description: 'Marque créée avec succès',
            })];
        _findOne_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Obtenir les détails d\'une marque' }), (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de la marque' }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Détails de la marque',
            })];
        _update_decorators = [(0, common_1.Patch)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Mettre à jour une marque' }), (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de la marque' }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Marque mise à jour',
            })];
        _addWebhook_decorators = [(0, common_1.Post)(':id/webhooks'), (0, swagger_1.ApiOperation)({ summary: 'Ajouter un webhook pour une marque' }), (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de la marque' }), (0, swagger_1.ApiResponse)({
                status: 201,
                description: 'Webhook ajouté',
            })];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addWebhook_decorators, { kind: "method", name: "addWebhook", static: false, private: false, access: { has: obj => "addWebhook" in obj, get: obj => obj.addWebhook }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BrandsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BrandsController = _classThis;
})();
exports.BrandsController = BrandsController;
