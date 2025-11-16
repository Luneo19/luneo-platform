import type { ApiKey } from '@/modules/public-api/api-keys/api-keys.service';

declare global {
  namespace Express {
    interface Request {
      brandId?: string;
      apiKey?: ApiKey;
      quotaCheck?: {
        metric: string;
        amount: number;
        brandId: string;
        checkedAt: string;
      };
    }

    interface User {
      id: string;
      email?: string;
      role?: string;
      brandId?: string | null;
      [key: string]: unknown;
    }
  }
}

export {};

