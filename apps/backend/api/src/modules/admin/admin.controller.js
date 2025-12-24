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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_guard_1 = require("@/common/guards/roles.guard");
const client_1 = require("@prisma/client");
let AdminController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('admin'), (0, common_1.Controller)('admin'), (0, swagger_1.ApiBearerAuth)(), (0, roles_guard_1.Roles)(client_1.UserRole.PLATFORM_ADMIN)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getMetrics_decorators;
    let _getAICosts_decorators;
    let _addBlacklistedPrompt_decorators;
    var AdminController = _classThis = class {
        constructor(adminService) {
            this.adminService = (__runInitializers(this, _instanceExtraInitializers), adminService);
        }
        async getMetrics() {
            return this.adminService.getMetrics();
        }
        async getAICosts(period) {
            return this.adminService.getAICosts(period);
        }
        async addBlacklistedPrompt(body) {
            return this.adminService.addBlacklistedPrompt(body.term);
        }
    };
    __setFunctionName(_classThis, "AdminController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getMetrics_decorators = [(0, common_1.Get)('metrics'), (0, swagger_1.ApiOperation)({ summary: 'Obtenir les métriques de la plateforme' }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Métriques de la plateforme',
            })];
        _getAICosts_decorators = [(0, common_1.Get)('ai/costs'), (0, swagger_1.ApiOperation)({ summary: 'Obtenir les coûts IA' }), (0, swagger_1.ApiQuery)({ name: 'period', required: false, description: 'Période (ex: 30d)' }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Coûts IA',
            })];
        _addBlacklistedPrompt_decorators = [(0, common_1.Post)('ai/blacklist'), (0, swagger_1.ApiOperation)({ summary: 'Ajouter un terme à la liste noire IA' }), (0, swagger_1.ApiResponse)({
                status: 201,
                description: 'Terme ajouté à la liste noire',
            })];
        __esDecorate(_classThis, null, _getMetrics_decorators, { kind: "method", name: "getMetrics", static: false, private: false, access: { has: obj => "getMetrics" in obj, get: obj => obj.getMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAICosts_decorators, { kind: "method", name: "getAICosts", static: false, private: false, access: { has: obj => "getAICosts" in obj, get: obj => obj.getAICosts }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addBlacklistedPrompt_decorators, { kind: "method", name: "addBlacklistedPrompt", static: false, private: false, access: { has: obj => "addBlacklistedPrompt" in obj, get: obj => obj.addBlacklistedPrompt }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AdminController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AdminController = _classThis;
})();
exports.AdminController = AdminController;
