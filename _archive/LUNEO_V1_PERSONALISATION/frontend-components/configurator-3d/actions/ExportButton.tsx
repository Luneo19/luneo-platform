'use client';

import React, { useState } from 'react';
import { Download, FileText, Box, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExportModal } from '../modals/ExportModal';
import { useConfigurator3DExport } from '@/hooks/configurator-3d/useConfigurator3DExport';
import { cn } from '@/lib/utils';

export interface ExportButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function ExportButton({
  className,
  variant = 'outline',
  size = 'default',
  showLabel = true,
}: ExportButtonProps) {
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [exportType, setExportType] = useState<'pdf' | '3d' | 'image'>('pdf');
  const {
    exportPDF,
    export3D,
    exportImage,
    pollExportStatus,
    downloadExport,
    isExporting,
  } = useConfigurator3DExport();

  const handleExport = async (
    type: 'pdf' | '3d' | 'image',
    exportFn: () => Promise<string | null>
  ) => {
    const jobId = await exportFn();
    if (jobId) {
      setExportType(type);
      setExportJobId(jobId);
      setExportModalOpen(true);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className={className}>
            <Download className={cn('h-4 w-4', showLabel && 'mr-2')} />
            {showLabel && 'Export'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handleExport('pdf', exportPDF)}
            disabled={isExporting}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport('3d', export3D)}
            disabled={isExporting}
          >
            <Box className="mr-2 h-4 w-4" />
            Export 3D
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport('image', exportImage)}
            disabled={isExporting}
          >
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image className="mr-2 h-4 w-4" />
            Export Image
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        jobId={exportJobId}
        exportType={exportType}
        onPoll={pollExportStatus}
        onDownload={downloadExport}
      />
    </>
  );
}
