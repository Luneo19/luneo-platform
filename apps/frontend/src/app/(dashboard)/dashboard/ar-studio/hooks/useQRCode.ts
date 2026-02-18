/**
 * Hook for QR code CRUD
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export interface QRCodeItem {
  id: string;
  url: string;
  imageUrl?: string;
  scanCount?: number;
  createdAt?: string;
  options?: { fgColor?: string; bgColor?: string; logo?: string; style?: string };
}

export interface CreateQROptions {
  fgColor?: string;
  bgColor?: string;
  logo?: string;
  style?: string;
}

export function useQRCode(projectId: string | null) {
  const [list, setList] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchList = useCallback(async () => {
    if (!projectId) {
      setList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await endpoints.ar.projects.qrCodes.list(projectId) as { data?: QRCodeItem[] };
      const data = body?.data ?? [];
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      logger.error('Failed to fetch QR codes', { error: err });
      setError(err instanceof Error ? err : new Error(String(err)));
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const create = useCallback(
    async (url: string, options?: CreateQROptions) => {
      if (!projectId) throw new Error('Project ID required');
      const created = await endpoints.ar.projects.qrCodes.create(projectId, { url, options }) as unknown as { id: string; imageUrl: string };
      setList((prev) => [...prev, { id: created.id, url, imageUrl: created.imageUrl, ...options }]);
      return created;
    },
    [projectId]
  );

  const download = useCallback(
    async (qrId: string, format: 'png' | 'svg' | 'pdf') => {
      if (!projectId) throw new Error('Project ID required');
      return await endpoints.ar.projects.qrCodes.download(projectId, qrId, format) as unknown as Blob;
    },
    [projectId]
  );

  return { list, loading, error, refetch: fetchList, create, download };
}
