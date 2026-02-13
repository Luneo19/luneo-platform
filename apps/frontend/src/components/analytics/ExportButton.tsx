'use client';

import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logger } from '@/lib/logger';
import { getBackendUrl } from '@/lib/api/server-url';

interface ExportButtonProps {
  startDate?: Date;
  endDate?: Date;
  className?: string;
}

export function ExportButton({ startDate, endDate, className }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      setIsExporting(true);

      const apiUrl = getBackendUrl();
      const params = new URLSearchParams();
      
      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString());
      }

      const url = `${apiUrl}/api/v1/analytics/export/${format}?${params.toString()}`;

      // Download file
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // Include cookies for auth
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `analytics-${format}-${Date.now()}.${format === 'excel' ? 'xlsx' : format}`;

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      logger.info('Analytics exported successfully', { format, filename });
    } catch (error) {
      logger.error('Export error', { error, format });
      alert('Erreur lors de l\'export. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={className}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Download className="w-4 h-4 mr-2 animate-spin" />
              Export...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="w-4 h-4 mr-2" />
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <File className="w-4 h-4 mr-2" />
          CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
