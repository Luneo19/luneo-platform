"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirePermissions = void 0;
const common_1 = require("@nestjs/common");
/**
 * Decorator pour spécifier les permissions requises
 * Usage: @RequirePermissions(Permission.PRODUCT_CREATE, Permission.PRODUCT_UPDATE)
 */
const RequirePermissions = (...permissions) => (0, common_1.SetMetadata)('permissions', permissions);
exports.RequirePermissions = RequirePermissions;
