/**
 * 🎨 Schemas de validation Zod pour les designs
 */

import { z } from 'zod';

export const CreateDesignSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  template: z.string().min(1, 'Le template est requis'),
  customizations: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateDesignSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  customizations: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export const ExportDesignSchema = z.object({
  format: z.enum(['png', 'svg', 'pdf', 'glb', 'usdz', 'fbx'], {
    errorMap: () => ({ message: 'Format non supporté' }),
  }),
  quality: z.enum(['low', 'medium', 'high', 'ultra']).default('high'),
  width: z.number().min(100).max(8000).optional(),
  height: z.number().min(100).max(8000).optional(),
});

// Types inférés
export type CreateDesignInput = z.infer<typeof CreateDesignSchema>;
export type UpdateDesignInput = z.infer<typeof UpdateDesignSchema>;
export type ExportDesignInput = z.infer<typeof ExportDesignSchema>;



