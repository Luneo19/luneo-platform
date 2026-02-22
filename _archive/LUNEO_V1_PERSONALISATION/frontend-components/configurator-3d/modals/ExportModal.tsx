'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Check, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type ExportType = 'pdf' | '3d' | 'image';

export interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string | null;
  exportType: ExportType;
  onPoll: (jobId: string) => Promise<{
    status: string;
    downloadUrl?: string;
    error?: string;
  }>;
  onDownload: (jobId: string) => Promise<void>;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Preparing...',
  processing: 'Processing...',
  completed: 'Complete!',
  failed: 'Export failed',
};

export function ExportModal({
  open,
  onOpenChange,
  jobId,
  exportType,
  onPoll,
  onDownload,
}: ExportModalProps) {
  const [status, setStatus] = useState<string>('pending');
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !jobId) return;

    setStatus('pending');
    setProgress(0);
    setError(null);
    setDownloadUrl(undefined);

    const poll = async () => {
      try {
        const result = await onPoll(jobId);
        setStatus(result.status);

        if (result.status === 'pending' || result.status === 'processing') {
          setProgress((p) => Math.min(p + 20, 90));
          setTimeout(poll, 2000);
        } else if (result.status === 'completed') {
          setProgress(100);
          setDownloadUrl(result.downloadUrl);
        } else if (result.status === 'failed') {
          setError(result.error ?? 'Export failed');
        }
      } catch (err) {
        setStatus('failed');
        setError(err instanceof Error ? err.message : 'Poll failed');
      }
    };

    poll();
  }, [open, jobId, onPoll]);

  const handleDownload = async () => {
    if (!jobId) return;
    try {
      await onDownload(jobId);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const isComplete = status === 'completed';
  const isFailed = status === 'failed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export {exportType.toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            {isComplete
              ? 'Your export is ready. Click download to save.'
              : isFailed
                ? 'Something went wrong. Please try again.'
                : 'Your export is being prepared. This may take a moment.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isFailed && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{STATUS_LABELS[status] ?? status}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {isFailed && error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive"
            >
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-success"
            >
              <Check className="h-5 w-5" />
              <span className="font-medium">Export ready!</span>
            </motion.div>
          )}
        </div>

        <DialogFooter>
          {isComplete ? (
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          ) : isFailed ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
