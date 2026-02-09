'use client';

import { TicketIcon, Plus, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SupportHeaderProps {
  onRefresh: () => void;
  onExport: () => void;
  onNewTicket: () => void;
}

export function SupportHeader({ onRefresh, onExport, onNewTicket }: SupportHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <TicketIcon className="w-8 h-8 text-cyan-400" />
          Support
        </h1>
        <p className="text-white/60">Gérez vos tickets et demandes d&apos;assistance</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" onClick={onRefresh} className="border-white/[0.06] hover:bg-white/[0.04]">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
        <Button variant="outline" onClick={onExport} className="border-white/[0.06] hover:bg-white/[0.04]">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
        <Button
          onClick={onNewTicket}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau ticket
        </Button>
      </div>
    </div>
  );
}
