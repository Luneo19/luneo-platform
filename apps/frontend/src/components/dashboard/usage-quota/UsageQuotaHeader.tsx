'use client';

import { ArrowUpRight, Download, Mail, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatRelative } from './utils';

interface UsageQuotaHeaderProps {
  liveMode: boolean;
  isDegraded: boolean;
  liveStatusLabel: string;
  lastLiveUpdate: number | null;
  onRefresh: () => void;
  onExportReport: () => void;
  exportingReport: boolean;
  emailShareLink: string | null;
  effectiveSummary: { brandId: string } | null;
  onCopyShareLink: () => void;
}

export function UsageQuotaHeader({
  liveMode,
  isDegraded,
  liveStatusLabel,
  lastLiveUpdate,
  onRefresh,
  onExportReport,
  exportingReport,
  emailShareLink,
  effectiveSummary,
  onCopyShareLink,
}: UsageQuotaHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-white">Usage & quotas</h2>
        <p className="text-sm text-gray-400">
          Surveillez vos consommations clés, anticipez les dépassements et transformez chaque alerte en action.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div
          className={cn(
            'flex items-center gap-2 rounded-full border px-3 py-1 text-xs',
            liveMode
              ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
              : isDegraded
                ? 'border-amber-500/60 bg-amber-500/10 text-amber-100'
                : 'border-gray-700 bg-gray-900/60 text-gray-400',
          )}
        >
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              liveMode
                ? 'bg-emerald-400 animate-pulse'
                : isDegraded
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-gray-500',
            )}
          />
          <span className="font-medium">{liveStatusLabel}</span>
          {lastLiveUpdate && (
            <span className="text-[11px] text-gray-500">
              MAJ {formatRelative(new Date(lastLiveUpdate))}
            </span>
          )}
        </div>
        <Button variant="outline" className="border-gray-700" onClick={() => onRefresh()}>
          <ArrowUpRight className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
        <Button
          variant="outline"
          className="border-gray-700"
          onClick={onExportReport}
          disabled={exportingReport || !effectiveSummary}
        >
          <Download className="mr-2 h-4 w-4" />
          {exportingReport ? 'Export...' : 'Exporter PDF'}
        </Button>
        <Button
          asChild
          variant="outline"
          className="border-gray-700"
          disabled={!emailShareLink}
        >
          <a href={emailShareLink ?? '#'} rel="noopener noreferrer">
            <Mail className="mr-2 h-4 w-4" />
            Envoyer par email
          </a>
        </Button>
        <Button
          variant="outline"
          className="border-gray-700"
          onClick={() => {
            void onCopyShareLink();
          }}
          disabled={!effectiveSummary}
        >
          <Share2 className="mr-2 h-4 w-4" />
          Copier le lien
        </Button>
      </div>
    </div>
  );
}
