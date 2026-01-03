import { z } from 'zod';
import type { WidgetConfig } from '../types/designer.types';

export const WidgetConfigSchema = z.object({
  container: z.union([z.string(), z.instanceof(HTMLElement)]),
  apiKey: z.string().min(1),
  productId: z.string().min(1),
  locale: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  onSave: z.function().optional(),
  onError: z.function().optional(),
  onReady: z.function().optional(),
});

export function validateWidgetConfig(config: unknown): config is WidgetConfig {
  try {
    WidgetConfigSchema.parse(config);
    return true;
  } catch {
    return false;
  }
}

