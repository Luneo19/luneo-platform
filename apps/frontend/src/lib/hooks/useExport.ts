/**
 * useExport Hook
 * A-008: Hook pour export CSV/PDF des rapports
 */

import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  dateRange: string;
  reportType: 'overview' | 'funnel' | 'products' | 'audience' | 'full';
  startDate?: string;
  endDate?: string;
}

interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
}

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportReport = useCallback(async (options: ExportOptions): Promise<ExportResult> => {
    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      if (options.format === 'csv') {
        // Handle CSV download
        const blob = await response.blob();
        const filename = response.headers.get('Content-Disposition')?.split('filename=')[1] || 
          `luneo-analytics-${options.dateRange}.csv`;
        
        downloadBlob(blob, filename);
        
        logger.info('CSV export successful', { filename });
        return { success: true, filename };
      }

      if (options.format === 'json') {
        // Handle JSON download
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const filename = `luneo-analytics-${options.dateRange}.json`;
        
        downloadBlob(blob, filename);
        
        logger.info('JSON export successful', { filename });
        return { success: true, filename };
      }

      if (options.format === 'pdf') {
        // Handle PDF generation
        const data = await response.json();
        
        if (data.html) {
          // Open in new window for printing
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(data.html);
            printWindow.document.close();
            printWindow.focus();
            
            // Auto-print after content loads
            printWindow.onload = () => {
              setTimeout(() => {
                printWindow.print();
              }, 500);
            };
          }
          
          logger.info('PDF export successful', { filename: data.filename });
          return { success: true, filename: data.filename };
        }
      }

      return { success: false, error: 'Format non supporté' };
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'export';
      setError(errorMessage);
      logger.error('Export error', { error: err, options });
      return { success: false, error: errorMessage };
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportCSV = useCallback((dateRange: string, reportType: ExportOptions['reportType'] = 'full') => {
    return exportReport({ format: 'csv', dateRange, reportType });
  }, [exportReport]);

  const exportJSON = useCallback((dateRange: string, reportType: ExportOptions['reportType'] = 'full') => {
    return exportReport({ format: 'json', dateRange, reportType });
  }, [exportReport]);

  const exportPDF = useCallback((dateRange: string, reportType: ExportOptions['reportType'] = 'full') => {
    return exportReport({ format: 'pdf', dateRange, reportType });
  }, [exportReport]);

  return {
    exportReport,
    exportCSV,
    exportJSON,
    exportPDF,
    isExporting,
    error,
    clearError: () => setError(null),
  };
}

// Helper function to download blob
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default useExport;


