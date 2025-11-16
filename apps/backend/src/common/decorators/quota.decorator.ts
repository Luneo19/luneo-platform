import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import type { UsageMetricType } from '@luneo/billing-plans';

import { QuotaGuard } from '../guards/quota.guard';

export interface QuotaOptions {
  metric: UsageMetricType;
  /**
   * Quantité à réserver / consommer. Par défaut 1.
   */
  amount?: number;
  /**
   * Chemin (dot notation) vers un champ du body contenant la quantité.
   * Exemple: "body.quantity" ou "body.items.length".
   */
  amountField?: string;
  /**
   * Chemin alternatif pour trouver le brandId si non présent sur la requête.
   */
  brandField?: string;
}

export const QUOTA_OPTIONS_METADATA_KEY = 'quota:options';

export function RequireQuota(options: QuotaOptions) {
  return applyDecorators(SetMetadata(QUOTA_OPTIONS_METADATA_KEY, options), UseGuards(QuotaGuard));
}

