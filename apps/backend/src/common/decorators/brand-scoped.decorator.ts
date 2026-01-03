import { SetMetadata } from '@nestjs/common';

export const BRAND_SCOPED_KEY = 'brandScoped';

/**
 * Decorator pour scoper automatiquement les requêtes par brandId
 * Utilise currentUser.brandId pour filtrer les résultats
 * 
 * @example
 * ```typescript
 * @BrandScoped()
 * @Get()
 * async findAll(@CurrentUser() user: CurrentUser) {
 *   // brandId automatiquement injecté dans request.brandId
 * }
 * ```
 */
export const BrandScoped = () => SetMetadata(BRAND_SCOPED_KEY, true);






