/**
 * ★★★ ROUTER TRPC - CUSTOMIZER EXPORT ★★★
 * Gestion complète de l'export
 * - Export image
 * - Export PDF
 * - Export print
 * - Statut des jobs d'export
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { TRPCError } from '@trpc/server';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';

// ========================================
// SCHEMAS ZOD
// ========================================

const ImageFormatSchema = z.enum(['PNG', 'JPG', 'JPEG', 'WEBP', 'SVG']);
const PDFFormatSchema = z.enum(['PDF']);

const ExportImageSchema = z.object({
  sessionId: z.string().min(1),
  format: ImageFormatSchema,
  quality: z.number().int().min(1).max(100).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const ExportPDFSchema = z.object({
  sessionId: z.string().min(1),
  options: z
    .object({
      format: z.enum(['A4', 'A3', 'LETTER', 'CUSTOM']).optional(),
      orientation: z.enum(['portrait', 'landscape']).optional(),
      quality: z.enum(['low', 'medium', 'high']).optional(),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
      includeMetadata: z.boolean().optional(),
    })
    .optional(),
});

const ExportPrintSchema = z.object({
  sessionId: z.string().min(1),
  options: z
    .object({
      format: z.enum(['A4', 'A3', 'LETTER', 'CUSTOM']).optional(),
      orientation: z.enum(['portrait', 'landscape']).optional(),
      quality: z.enum(['draft', 'standard', 'high']).optional(),
      copies: z.number().int().positive().default(1).optional(),
      colorMode: z.enum(['color', 'grayscale']).optional(),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
    })
    .optional(),
});

// ========================================
// ROUTER
// ========================================

export const customizerExportRouter = router({
  /**
   * Exporter en image
   */
  exportImage: protectedProcedure
    .input(ExportImageSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const session = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/sessions/${input.sessionId}`).catch(() => null);

        if (!session) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Session introuvable',
          });
        }

        const body: Record<string, unknown> = {
          format: input.format,
        };
        if (input.quality !== undefined) body.quality = input.quality;
        if (input.width !== undefined) body.width = input.width;
        if (input.height !== undefined) body.height = input.height;

        const exportJob = await api.post<{ jobId: string; status: string; downloadUrl?: string }>(
          `/api/v1/visual-customizer/sessions/${input.sessionId}/export/image`,
          body
        );

        logger.info('Image export started', { sessionId: input.sessionId, jobId: exportJob.jobId });

        return exportJob;
      } catch (error) {
        logger.error('Error exporting image', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de l\'export de l\'image',
        });
      }
    }),

  /**
   * Exporter en PDF
   */
  exportPDF: protectedProcedure
    .input(ExportPDFSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const session = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/sessions/${input.sessionId}`).catch(() => null);

        if (!session) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Session introuvable',
          });
        }

        const exportJob = await api.post<{ jobId: string; status: string; downloadUrl?: string }>(
          `/api/v1/visual-customizer/sessions/${input.sessionId}/export/pdf`,
          input.options || {}
        );

        logger.info('PDF export started', { sessionId: input.sessionId, jobId: exportJob.jobId });

        return exportJob;
      } catch (error) {
        logger.error('Error exporting PDF', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de l\'export PDF',
        });
      }
    }),

  /**
   * Exporter pour impression
   */
  exportPrint: protectedProcedure
    .input(ExportPrintSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const session = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/sessions/${input.sessionId}`).catch(() => null);

        if (!session) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Session introuvable',
          });
        }

        const exportJob = await api.post<{ jobId: string; status: string; downloadUrl?: string }>(
          `/api/v1/visual-customizer/sessions/${input.sessionId}/export/print`,
          input.options || {}
        );

        logger.info('Print export started', { sessionId: input.sessionId, jobId: exportJob.jobId });

        return exportJob;
      } catch (error) {
        logger.error('Error exporting for print', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de l\'export pour impression',
        });
      }
    }),

  /**
   * Récupérer le statut d'un job d'export
   */
  getJobStatus: protectedProcedure
    .input(z.object({ jobId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      try {
        const jobStatus = await api.get<{
          jobId: string;
          status: string;
          progress?: number;
          downloadUrl?: string;
          error?: string;
          createdAt?: string;
          completedAt?: string;
        }>(`/api/v1/visual-customizer/export/jobs/${input.jobId}`).catch(() => null);

        if (!jobStatus) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Job d\'export introuvable',
          });
        }

        return jobStatus;
      } catch (error) {
        logger.error('Error fetching job status', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération du statut du job',
        });
      }
    }),
});
