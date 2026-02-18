/**
 * useConfigurator3DExport - Export with polling
 * exportPDF, exportAR, export3D, exportImage return jobId
 * pollExportStatus: polls every 2s until completed/failed
 */

import { useCallback, useState } from 'react';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import type { ExportPDFOptions, ExportAROptions, Export3DOptions, ExportImageOptions } from '@/lib/configurator-3d/types/configurator.types';

const POLL_INTERVAL_MS = 2000;

export type ExportFormat = 'pdf' | 'ar' | '3d' | 'image';

export interface UseConfigurator3DExportReturn {
  exportPDF: (options?: ExportPDFOptions) => Promise<string | null>;
  exportAR: (options?: ExportAROptions) => Promise<string | null>;
  export3D: (options?: Export3DOptions) => Promise<string | null>;
  exportImage: (options?: ExportImageOptions) => Promise<string | null>;
  pollExportStatus: (jobId: string) => Promise<{ status: string; downloadUrl?: string; error?: string }>;
  downloadExport: (jobId: string) => Promise<void>;
  isExporting: boolean;
  exportError: string | null;
}

export function useConfigurator3DExport(): UseConfigurator3DExportReturn {
  const sessionId = useConfigurator3DStore((s) => s.sessionId);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportPDF = useCallback(
    async (options?: ExportPDFOptions): Promise<string | null> => {
      if (!sessionId) return null;
      try {
        setExportError(null);
        const res = await configurator3dEndpoints.export.pdf(sessionId, options);
        return res.jobId ?? null;
      } catch (err) {
        setExportError(err instanceof Error ? err.message : 'Export failed');
        return null;
      }
    },
    [sessionId]
  );

  const exportAR = useCallback(
    async (options?: ExportAROptions): Promise<string | null> => {
      if (!sessionId) return null;
      try {
        setExportError(null);
        const res = await configurator3dEndpoints.export.ar(sessionId, options);
        return res.jobId ?? null;
      } catch (err) {
        setExportError(err instanceof Error ? err.message : 'Export failed');
        return null;
      }
    },
    [sessionId]
  );

  const export3D = useCallback(
    async (options?: Export3DOptions): Promise<string | null> => {
      if (!sessionId) return null;
      try {
        setExportError(null);
        const res = await configurator3dEndpoints.export.threeD(sessionId, options);
        return res.jobId ?? null;
      } catch (err) {
        setExportError(err instanceof Error ? err.message : 'Export failed');
        return null;
      }
    },
    [sessionId]
  );

  const exportImage = useCallback(
    async (options?: ExportImageOptions): Promise<string | null> => {
      if (!sessionId) return null;
      try {
        setExportError(null);
        const res = await configurator3dEndpoints.export.image(sessionId, options);
        return res.jobId ?? null;
      } catch (err) {
        setExportError(err instanceof Error ? err.message : 'Export failed');
        return null;
      }
    },
    [sessionId]
  );

  const pollExportStatus = useCallback(
    async (jobId: string): Promise<{ status: string; downloadUrl?: string; error?: string }> => {
      if (!sessionId) throw new Error('No session');
      setIsExporting(true);

      return new Promise((resolve) => {
        const poll = async () => {
          try {
            const status = await configurator3dEndpoints.export.status(sessionId, jobId);
            if (status.status === 'completed' || status.status === 'failed') {
              setIsExporting(false);
              resolve({
                status: status.status,
                downloadUrl: status.downloadUrl,
                error: status.error,
              });
              return;
            }
            setTimeout(poll, POLL_INTERVAL_MS);
          } catch (err) {
            setIsExporting(false);
            resolve({
              status: 'failed',
              error: err instanceof Error ? err.message : 'Poll failed',
            });
          }
        };
        poll();
      });
    },
    [sessionId]
  );

  const downloadExport = useCallback(
    async (jobId: string): Promise<void> => {
      if (!sessionId) throw new Error('No session');
      const blob = await configurator3dEndpoints.export.download(sessionId, jobId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `configurator-export-${jobId}.${blob.type.includes('pdf') ? 'pdf' : 'zip'}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [sessionId]
  );

  return {
    exportPDF,
    exportAR,
    export3D,
    exportImage,
    pollExportStatus,
    downloadExport,
    isExporting,
    exportError,
  };
}