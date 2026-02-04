import { z } from 'zod';

export const AnalyticsExportSchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'ytd', 'all']).optional().default('30d'),
  format: z.enum(['csv', 'json', 'xlsx', 'pdf']).optional().default('csv'),
  metrics: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  dateRange: z.string().optional(),
  reportType: z.enum(['full', 'funnel', 'products', 'audience', 'overview']).optional().default('full'),
});

export type AnalyticsExportInput = z.infer<typeof AnalyticsExportSchema>;
