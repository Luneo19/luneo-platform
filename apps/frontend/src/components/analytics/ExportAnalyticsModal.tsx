'use client';

import { useState, useCallback } from 'react';
import { Download, FileText, FileSpreadsheet, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface ExportAnalyticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: string[];
  timeRange: string;
  startDate?: string;
  endDate?: string;
  onExportStart?: () => void;
  onExportComplete?: () => void;
}

export function ExportAnalyticsModal({
  open,
  onOpenChange,
  metrics,
  timeRange,
  startDate,
  endDate,
  onExportStart,
  onExportComplete,
}: ExportAnalyticsModalProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    onExportStart?.();
    
    try {
      const queryParams = new URLSearchParams({
        metrics: metrics.join(','),
        timeRange,
      });
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      let url = '';
      let filename = '';

      switch (exportFormat) {
        case 'csv':
          url = `/api/v1/analytics/export/csv?${queryParams.toString()}`;
          filename = `analytics_export_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'excel':
          url = `/api/v1/analytics/export/excel?${queryParams.toString()}`;
          filename = `analytics_export_${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'pdf':
          url = `/api/v1/analytics/export/pdf?${queryParams.toString()}`;
          filename = `analytics_export_${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        default:
          throw new Error('Invalid export format');
      }

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // Include cookies for auth
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to export data' }));
        throw new Error(errorData.message || 'Failed to export data');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`Export ${exportFormat.toUpperCase()} réussi !`);
      onExportComplete?.();
      onOpenChange(false);
    } catch (error) {
      logger.error('Error exporting analytics', { error });
      toast.error(`Échec de l'export ${exportFormat.toUpperCase()}.`);
    } finally {
      setIsExporting(false);
    }
  }, [metrics, timeRange, startDate, endDate, exportFormat, onExportStart, onExportComplete, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exporter les données Analytics</DialogTitle>
          <DialogDescription>
            Choisissez le format d'exportation pour vos données analytics.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup
            value={exportFormat}
            onValueChange={(value: 'csv' | 'excel' | 'pdf') => setExportFormat(value)}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="csv" />
              <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                <FileText className="w-4 h-4" /> CSV (Comma Separated Values)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="excel" id="excel" />
              <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer">
                <FileSpreadsheet className="w-4 h-4" /> Excel (XLSX)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                <File className="w-4 h-4" /> PDF
              </Label>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exportation...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" /> Exporter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
