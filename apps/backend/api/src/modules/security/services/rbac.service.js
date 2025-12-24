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
exports.RBACService = void 0;
const common_1 = require("@nestjs/common");
const rbac_interface_1 = require("../interfaces/rbac.interface");
/**
 * Service RBAC (Role-Based Access Control)
 * Gère les rôles, permissions et autorisations
 */
let RBACService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RBACService = _classThis = class {
        constructor(prisma, cache) {
            this.prisma = prisma;
            this.cache = cache;
            this.logger = new common_1.Logger(RBACService.name);
            this.customRules = [];
        }
        /**
         * Récupérer les permissions d'un rôle
         */
        getRolePermissions(role) {
            return rbac_interface_1.ROLE_PERMISSIONS[role] || [];
        }
        /**
         * Vérifier si un rôle a une permission
         */
        roleHasPermission(role, permission) {
            const permissions = this.getRolePermissions(role);
            return permissions.includes(permission);
        }
        /**
         * Vérifier si un utilisateur a une permission
         */
        async userHasPermission(userId, permission) {
            try {
                // Check cache
                const cacheKey = `rbac:user:${userId}:${permission}`;
                const cached = await this.cache.get(cacheKey, null, null);
                if (cached !== null) {
                    return cached === 'true';
                }
                // Récupérer l'utilisateur avec son rôle
                // @ts-ignore - user exists in schema but Prisma client may need regeneration
                const user = await this.prisma.user.findUnique({
                    where: { id: userId },
                    select: { role: true },
                });
                if (!user) {
                    return false;
                }
                const hasPermission = this.roleHasPermission(user.role, permission);
                // Cache pour 5 minutes
                await this.cache.set(cacheKey, hasPermission ? 'true' : 'false', 300);
                return hasPermission;
            }
            catch (error) {
                this.logger.error(`Failed to check user permission: ${error.message}`, error.stack);
                return false;
            }
        }
        /**
         * Vérifier si un utilisateur peut accéder à une ressource
         */
        async authorize(context) {
            try {
                // 1. Vérifier la permission de base
                const hasPermission = context.user.permissions.includes(context.action);
                if (!hasPermission) {
                    this.logger.warn(`User ${context.user.id} denied: missing permission ${context.action}`);
                    return false;
                }
                // 2. Vérifier les règles personnalisées
                for (const rule of this.customRules) {
                    if (!rule.condition(context)) {
                        this.logger.warn(`User ${context.user.id} denied by custom rule: ${rule.resource}`);
                        return false;
                    }
                }
                // 3. Vérifier l'isolation par brand (si applicable)
                if (context.resource && context.resource.brandId && context.user.brandId) {
                    if (context.resource.brandId !== context.user.brandId) {
                        // Super admin peut accéder à tout
                        if (context.user.role !== rbac_interface_1.Role.SUPER_ADMIN) {
                            this.logger.warn(`User ${context.user.id} denied: cross-brand access attempt`);
                            return false;
                        }
                    }
                }
                return true;
            }
            catch (error) {
                this.logger.error(`Authorization error: ${error.message}`, error.stack);
                return false;
            }
        }
        /**
         * Appliquer l'autorisation (throw si refusé)
         */
        async enforce(context) {
            const authorized = await this.authorize(context);
            if (!authorized) {
                throw new common_1.ForbiddenException(`You don't have permission to perform this action`);
            }
        }
        /**
         * Ajouter une règle d'accès personnalisée
         */
        addAccessRule(rule) {
            this.customRules.push(rule);
            this.logger.log(`Custom access rule added for resource: ${rule.resource}`);
        }
        /**
         * Assigner un rôle à un utilisateur
         */
        async assignRole(userId, role) {
            try {
                // @ts-ignore - user exists in schema but Prisma client may need regeneration
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { role: role },
                });
                // Invalider le cache
                await this.invalidateUserCache(userId);
                this.logger.log(`Role ${role} assigned to user ${userId}`);
            }
            catch (error) {
                this.logger.error(`Failed to assign role: ${error.message}`, error.stack);
                throw error;
            }
        }
        /**
         * Récupérer le rôle d'un utilisateur
         */
        async getUserRole(userId) {
            try {
                // @ts-ignore - user exists in schema but Prisma client may need regeneration
                const user = await this.prisma.user.findUnique({
                    where: { id: userId },
                    select: { role: true },
                });
                return user?.role || rbac_interface_1.Role.VIEWER;
            }
            catch (error) {
                this.logger.error(`Failed to get user role: ${error.message}`, error.stack);
                return rbac_interface_1.Role.VIEWER;
            }
        }
        /**
         * Récupérer toutes les permissions d'un utilisateur
         */
        async getUserPermissions(userId) {
            try {
                const role = await this.getUserRole(userId);
                return this.getRolePermissions(role);
            }
            catch (error) {
                this.logger.error(`Failed to get user permissions: ${error.message}`, error.stack);
                return [];
            }
        }
        /**
         * Vérifier si un utilisateur est admin
         */
        async isAdmin(userId) {
            const role = await this.getUserRole(userId);
            return role === rbac_interface_1.Role.ADMIN || role === rbac_interface_1.Role.SUPER_ADMIN;
        }
        /**
         * Vérifier si un utilisateur est super admin
         */
        async isSuperAdmin(userId) {
            const role = await this.getUserRole(userId);
            return role === rbac_interface_1.Role.SUPER_ADMIN;
        }
        /**
         * Lister les utilisateurs par rôle
         */
        async getUsersByRole(role, brandId) {
            try {
                const where = { role };
                if (brandId) {
                    where.brandId = brandId;
                }
                // @ts-ignore - user exists in schema but Prisma client may need regeneration
                return await this.prisma.user.findMany({
                    where,
                    select: {
                        id: true,
                        email: true,
                        // @ts-ignore - name exists in schema but Prisma client may need regeneration
                        name: true,
                        role: true,
                        brandId: true,
                        createdAt: true,
                    },
                });
            }
            catch (error) {
                this.logger.error(`Failed to get users by role: ${error.message}`, error.stack);
                return [];
            }
        }
        /**
         * Statistiques des rôles
         */
        async getRoleStats(brandId) {
            try {
                const where = {};
                if (brandId) {
                    where.brandId = brandId;
                }
                // @ts-ignore - user exists in schema but Prisma client may need regeneration
                const users = await this.prisma.user.groupBy({
                    by: ['role'],
                    where,
                    _count: true,
                });
                const stats = {};
                for (const role of Object.values(rbac_interface_1.Role)) {
                    stats[role] = 0;
                }
                for (const group of users) {
                    stats[group.role] = group._count;
                }
                return stats;
            }
            catch (error) {
                this.logger.error(`Failed to get role stats: ${error.message}`, error.stack);
                return {};
            }
        }
        /**
         * Invalider le cache d'un utilisateur
         */
        async invalidateUserCache(userId) {
            const permissions = Object.values(rbac_interface_1.Permission);
            const promises = permissions.map((perm) => this.cache.delSimple(`rbac:user:${userId}:${perm}`));
            await Promise.all(promises);
        }
        /**
         * Comparer deux rôles (pour déterminer la hiérarchie)
         */
        compareRoles(role1, role2) {
            const hierarchy = {
                [rbac_interface_1.Role.SUPER_ADMIN]: 5,
                [rbac_interface_1.Role.ADMIN]: 4,
                [rbac_interface_1.Role.MANAGER]: 3,
                [rbac_interface_1.Role.DESIGNER]: 2,
                [rbac_interface_1.Role.VIEWER]: 1,
            };
            return hierarchy[role1] - hierarchy[role2];
        }
        /**
         * Vérifier si un rôle est supérieur à un autre
         */
        isRoleHigher(role1, role2) {
            return this.compareRoles(role1, role2) > 0;
        }
    };
    __setFunctionName(_classThis, "RBACService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RBACService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RBACService = _classThis;
})();
exports.RBACService = RBACService;
