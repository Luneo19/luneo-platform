import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENCY_KEY = 'idempotencyKey';

/**
 * Decorator pour activer l'idempotency sur un endpoint
 * Utilise le header Idempotency-Key ou X-Idempotency-Key
 * 
 * @example
 * ```typescript
 * @IdempotencyKey()
 * @Post()
 * async create(@Body() dto: CreateDto) {
 *   // Requêtes avec même Idempotency-Key retournent la même réponse
 * }
 * ```
 */
export const IdempotencyKey = () => SetMetadata(IDEMPOTENCY_KEY, true);










