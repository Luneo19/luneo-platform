/**
 * useConfigurator3DAR - AR detection and launch
 * isARSupported: WebXR / iOS AR Quick Look
 * launchAR(format): export and open AR
 */

import { useState, useCallback, useMemo } from 'react';
import { useConfigurator3DExport } from './useConfigurator3DExport';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';

export type ARStatus = 'idle' | 'exporting' | 'ready' | 'viewing';

export type ARFormat = 'usdz' | 'glb';

export interface UseConfigurator3DARReturn {
  isARSupported: boolean;
  launchAR: (format?: ARFormat) => Promise<void>;
  arStatus: ARStatus;
  arError: string | null;
}

function detectARSupport(): boolean {
  if (typeof window === 'undefined') return false;

  // iOS AR Quick Look - Safari with USDZ support
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return true;

  // WebXR AR support
  if ('xr' in navigator) {
    return true; // Assume support - actual check is async
  }

  return false;
}

export function useConfigurator3DAR(): UseConfigurator3DARReturn {
  const [arStatus, setArStatus] = useState<ARStatus>('idle');
  const [arError, setArError] = useState<string | null>(null);
  const { exportAR, pollExportStatus, downloadExport } = useConfigurator3DExport();
  const sessionId = useConfigurator3DStore((s) => s.sessionId);

  const isARSupported = useMemo(detectARSupport, []);

  const launchAR = useCallback(
    async (format: ARFormat = 'usdz') => {
      if (!isARSupported) {
        setArError('AR is not supported on this device');
        return;
      }
      if (!sessionId) {
        setArError('No active session');
        return;
      }

      setArStatus('exporting');
      setArError(null);

      try {
        const jobId = await exportAR({ format, quality: 'high' });
        if (!jobId) {
          setArStatus('idle');
          setArError('Export failed');
          return;
        }

        const result = await pollExportStatus(jobId);
        if (result.status === 'failed') {
          setArStatus('idle');
          setArError(result.error ?? 'Export failed');
          return;
        }

        setArStatus('ready');

        if (result.downloadUrl) {
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          if (isIOS && format === 'usdz') {
            window.location.href = result.downloadUrl;
            setArStatus('viewing');
          } else {
            await downloadExport(jobId);
            setArStatus('idle');
          }
        } else {
          await downloadExport(jobId);
          setArStatus('idle');
        }
      } catch (err) {
        setArStatus('idle');
        setArError(err instanceof Error ? err.message : 'AR launch failed');
      }
    },
    [isARSupported, sessionId, exportAR, pollExportStatus, downloadExport]
  );

  return {
    isARSupported,
    launchAR,
    arStatus,
    arError,
  };
}