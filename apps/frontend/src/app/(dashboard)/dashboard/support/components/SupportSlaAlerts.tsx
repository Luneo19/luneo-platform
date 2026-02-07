'use client';

import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Ticket } from '@/lib/hooks/useSupport';
import type { SLA } from './types';

interface SupportSlaAlertsProps {
  tickets: Ticket[];
  calculateSLA: (ticket: Ticket) => SLA;
  onViewTicket: (ticketId: string) => void;
}

export function SupportSlaAlerts({ tickets, calculateSLA, onViewTicket }: SupportSlaAlertsProps) {
  const atRiskOrBreached = tickets
    .filter((t) => t.status !== 'closed')
    .slice(0, 3)
    .map((ticket) => ({ ticket, sla: calculateSLA(ticket) }))
    .filter(({ sla }) => sla.status === 'breached' || sla.status === 'at-risk');

  if (atRiskOrBreached.length === 0) return null;

  return (
    <>
      {atRiskOrBreached.map(({ ticket, sla }) => (
        <Card
          key={ticket.id}
          className={cn(
            'p-4 border',
            sla.status === 'breached' ? 'bg-red-900/20 border-red-500/30' : 'bg-yellow-900/20 border-yellow-500/30'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle
                className={cn('w-5 h-5', sla.status === 'breached' ? 'text-red-400' : 'text-yellow-400')}
              />
              <div>
                <p className="text-sm font-medium text-white">
                  Ticket #{ticket.ticketNumber} - {sla.status === 'breached' ? 'SLA dépassé' : 'SLA à risque'}
                </p>
                <p className="text-xs text-gray-400">
                  Temps de résolution: {sla.resolutionTime.toFixed(1)}h restantes
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => onViewTicket(ticket.id)} className="border-gray-600">
              Voir
            </Button>
          </div>
        </Card>
      ))}
    </>
  );
}
