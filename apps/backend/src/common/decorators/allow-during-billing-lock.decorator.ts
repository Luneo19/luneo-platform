import { SetMetadata } from '@nestjs/common';

export const ALLOW_DURING_BILLING_LOCK_KEY = 'allowDuringBillingLock';

/**
 * Allows an endpoint to bypass billing lock checks (SUSPENDED/CANCELED or grace read-only).
 * Use sparingly for critical routes like auth or billing recovery.
 */
export const AllowDuringBillingLock = () => SetMetadata(ALLOW_DURING_BILLING_LOCK_KEY, true);
