import { z } from 'zod';

export const AnalyticsExportSchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'ytd', 'all']).optional().default('30d'),
  format: z.enum(['csv', 'json', 'xlsx']).optional().default('csv'),
  metrics: z.array(z.string()).optional(),
});

export type AnalyticsExportInput = z.infer<typeof AnalyticsExportSchema>;
