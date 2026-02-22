/**
 * useExport
 * Export functionality hook for images, PDFs, SVG, and print
 * Supports both client-side quick export and server-side high-quality export
 */

'use client';

import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc/client';
import { ImageExporter, PDFExporter } from '@/lib/customizer';
import { logger } from '@/lib/logger';
import Konva from 'konva';

interface ImageExportOptions {
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  width?: number;
  height?: number;
  scale?: number;
}

interface PDFExportOptions {
  format?: 'A4' | 'A3' | 'LETTER' | 'CUSTOM';
  orientation?: 'portrait' | 'landscape';
  quality?: 'low' | 'medium' | 'high';
  width?: number;
  height?: number;
}

interface SVGExportOptions {
  includeMetadata?: boolean;
}

interface PrintExportOptions {
  format?: 'A4' | 'A3' | 'LETTER' | 'CUSTOM';
  orientation?: 'portrait' | 'landscape';
  quality?: 'draft' | 'standard' | 'high';
  copies?: number;
  colorMode?: 'color' | 'grayscale';
}

interface UseExportReturn {
  exportImage: (options?: ImageExportOptions) => Promise<string>;
  exportPDF: (options?: PDFExportOptions) => Promise<string>;
  exportSVG: (options?: SVGExportOptions) => Promise<string>;
  exportPrint: (options?: PrintExportOptions) => Promise<string>;
  isExporting: boolean;
  exportProgress: number;
  downloadExport: (jobId: string) => Promise<void>;
}

interface UseExportOptions {
  sessionId?: string;
  stageRef?: Konva.Stage | null;
  useServerExport?: boolean;
}

/**
 * Export functionality hook
 */
export function useExport(options: UseExportOptions = {}): UseExportReturn {
  const { sessionId, stageRef, useServerExport = false } = options;

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Note: ImageExporter and PDFExporter use static methods

  // Server-side export mutations
  const exportImageMutation = trpc.visualCustomizer.export.exportImage.useMutation();
  const exportPDFMutation = trpc.visualCustomizer.export.exportPDF.useMutation();
  const exportPrintMutation = trpc.visualCustomizer.export.exportPrint.useMutation();
  const getJobStatus = trpc.visualCustomizer.export.getJobStatus.useQuery;

  const exportImage = useCallback(
    async (opts?: ImageExportOptions): Promise<string> => {
      if (!stageRef) {
        throw new Error('Stage ref is required for export');
      }

      setIsExporting(true);
      setExportProgress(0);

      try {
        if (useServerExport && sessionId) {
          // Server-side export
          const result = await exportImageMutation.mutateAsync({
            sessionId,
            format: (opts?.format?.toUpperCase() || 'PNG') as 'PNG' | 'JPG' | 'JPEG' | 'WEBP',
            quality: opts?.quality,
            width: opts?.width,
            height: opts?.height,
          });

          if (result.downloadUrl) {
            window.open(result.downloadUrl, '_blank');
            setIsExporting(false);
            return result.downloadUrl;
          }

          // Poll for job completion
          const jobId = result.jobId;
          // Polling logic would go here
          setIsExporting(false);
          return jobId;
        } else {
          // Client-side quick export
          const dataUrl = ImageExporter.exportAsDataURL(stageRef, {
            format: opts?.format || 'png',
            quality: opts?.quality,
            pixelRatio: opts?.scale,
          });

          // Create download link
          const link = document.createElement('a');
          link.download = `export.${opts?.format || 'png'}`;
          link.href = dataUrl;
          link.click();

          setIsExporting(false);
          return dataUrl;
        }
      } catch (error) {
        setIsExporting(false);
        logger.error('useExport: exportImage failed', { error });
        throw error;
      }
    },
    [stageRef, sessionId, useServerExport, exportImageMutation]
  );

  const exportPDF = useCallback(
    async (opts?: PDFExportOptions): Promise<string> => {
      if (!stageRef) {
        throw new Error('Stage ref is required for export');
      }

      setIsExporting(true);
      setExportProgress(0);

      try {
        if (useServerExport && sessionId) {
          // Server-side export
          const result = await exportPDFMutation.mutateAsync({
            sessionId,
            options: opts,
          });

          if (result.downloadUrl) {
            window.open(result.downloadUrl, '_blank');
            setIsExporting(false);
            return result.downloadUrl;
          }

          setIsExporting(false);
          return result.jobId;
        } else {
          // Client-side export
          const pdf = await PDFExporter.exportToPDF(stageRef, {
            format: opts?.format === 'A4' ? 'a4' : opts?.format === 'A3' ? 'a3' : opts?.format === 'LETTER' ? 'letter' : 'a4',
            orientation: opts?.orientation || 'portrait',
          });

          PDFExporter.downloadPDF(pdf, 'export.pdf');

          setIsExporting(false);
          return 'export.pdf';
        }
      } catch (error) {
        setIsExporting(false);
        logger.error('useExport: exportPDF failed', { error });
        throw error;
      }
    },
    [stageRef, sessionId, useServerExport, exportPDFMutation]
  );

  const exportSVG = useCallback(
    async (opts?: SVGExportOptions): Promise<string> => {
      if (!stageRef) {
        throw new Error('Stage ref is required for export');
      }

      setIsExporting(true);

      try {
        // Client-side SVG export - Konva doesn't have toSVG, use toDataURL instead
        // For proper SVG export, we'd need to serialize the stage manually
        // For now, export as PNG and convert to SVG-like format
        const dataUrl = stageRef.toDataURL({
          pixelRatio: 2,
        });

        // Create a simple SVG wrapper with the image
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${stageRef.width()}" height="${stageRef.height()}" xmlns="http://www.w3.org/2000/svg">
  <image href="${dataUrl}" width="${stageRef.width()}" height="${stageRef.height()}"/>
</svg>`;

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'export.svg';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        setIsExporting(false);
        return url;
      } catch (error) {
        setIsExporting(false);
        logger.error('useExport: exportSVG failed', { error });
        throw error;
      }
    },
    [stageRef]
  );

  const exportPrint = useCallback(
    async (opts?: PrintExportOptions): Promise<string> => {
      if (!stageRef) {
        throw new Error('Stage ref is required for export');
      }

      setIsExporting(true);

      try {
        if (useServerExport && sessionId) {
          // Server-side export
          const result = await exportPrintMutation.mutateAsync({
            sessionId,
            options: opts,
          });

          setIsExporting(false);
          return result.jobId;
        } else {
          // Client-side print
          const printWindow = window.open('', '_blank');
          if (!printWindow) {
            throw new Error('Failed to open print window');
          }

          const dataUrl = stageRef.toDataURL({ pixelRatio: 2 });
          printWindow.document.write(`
            <html>
              <head><title>Print</title></head>
              <body style="margin:0;padding:0;">
                <img src="${dataUrl}" style="width:100%;height:auto;" />
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();

          setIsExporting(false);
          return 'print';
        }
      } catch (error) {
        setIsExporting(false);
        logger.error('useExport: exportPrint failed', { error });
        throw error;
      }
    },
    [stageRef, sessionId, useServerExport, exportPrintMutation]
  );

  const downloadExport = useCallback(async (jobId: string): Promise<void> => {
    // Poll for job status and download when ready
    logger.info('useExport: downloading export', { jobId });
    // Implementation would poll getJobStatus and download when ready
  }, []);

  return {
    exportImage,
    exportPDF,
    exportSVG,
    exportPrint,
    isExporting,
    exportProgress,
    downloadExport,
  };
}
