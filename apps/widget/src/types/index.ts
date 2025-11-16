import type {
  WidgetConfig as BaseWidgetConfig,
  WidgetCallbacks,
  Design as BaseDesign,
} from '@luneo/types';

import type { WidgetRateLimitConfig, WidgetSecurityOptions } from '../lib/security';

export interface WidgetConfig extends BaseWidgetConfig {
  /** API base URL (defaults to public Luneo endpoint) */
  apiBaseUrl?: string;
  /** Rate limiting configuration applied client-side */
  rateLimit?: Partial<WidgetRateLimitConfig>;
  /** Security options (allowed origins, sandbox, etc.) */
  security?: WidgetSecurityOptions;
  /** Maximum prompt length before sanitisation */
  promptMaxLength?: number;
  /** Optional product identifier used by backend */
  productId?: string;
}

export interface WidgetDesign extends BaseDesign {
  title?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
}

export type Design = WidgetDesign;

export type { WidgetCallbacks };

export interface WidgetRuntimeState {
  prompt: string;
  isLoading: boolean;
  error: Error | null;
  design: Design | null;
}


