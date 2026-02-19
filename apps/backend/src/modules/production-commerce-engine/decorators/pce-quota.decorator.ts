import { SetMetadata } from '@nestjs/common';

export const PCE_QUOTA_KEY = 'pce-quota';

export type PCEQuotaType = 'orders' | 'renders' | 'concurrent_pipelines';

/**
 * Apply PCE plan quota check to an endpoint.
 * Use with PCEQuotaGuard. Pass one or more types: 'orders' | 'renders' | 'concurrent_pipelines'
 */
export const PCEQuota = (type: PCEQuotaType | PCEQuotaType[]) =>
  SetMetadata(PCE_QUOTA_KEY, Array.isArray(type) ? type : [type]);
