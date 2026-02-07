'use client';

import { Send, Loader2, Paperclip } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { TicketDetailHeader } from './TicketDetailHeader';
import { TicketDetailContent } from './TicketDetailContent';
import type { Ticket } from '@/lib/hooks/useSupport';
import type { SLA } from './types';

interface TicketDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  sla: SLA | null;
  newMessage: string;
  setNewMessage: (v: string) => void;
  sendingMessage: boolean;
  formatDate: (date: Date | string) => string;
  formatRelativeTime: (date: Date | string) => string;
  onUpdateStatus: (ticketId: string, status: string) => void;
  onUpdatePriority: (ticketId: string, priority: string) => void;
  onSendMessage: (ticketId: string) => void;
  onOpenCSAT: () => void;
  onOpenTemplates: () => void;
}

export function TicketDetailDialog({
  open,
  onOpenChange,
  ticket,
  sla,
  newMessage,
  setNewMessage,
  sendingMessage,
  formatDate,
  formatRelativeTime,
  onUpdateStatus,
  onUpdatePriority,
  onSendMessage,
  onOpenCSAT,
  onOpenTemplates,
}: TicketDetailDialogProps) {
  if (!ticket) return null;

  const calculatedSla = sla ?? {
    id: ticket.id,
    name: 'Standard SLA',
    firstResponseTime: 0,
    resolutionTime: 0,
    status: 'on-track' as const,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gray-800 border-gray-700 text-white max-h-[90vh] overflow-hidden flex flex-col">
        <TicketDetailHeader
          ticket={ticket}
          sla={calculatedSla}
          formatDate={formatDate}
          onUpdateStatus={onUpdateStatus}
          onUpdatePriority={onUpdatePriority}
          onOpenCSAT={onOpenCSAT}
        />
        <TicketDetailContent
          ticket={ticket}
          sla={calculatedSla}
          formatRelativeTime={formatRelativeTime}
          onOpenTemplates={onOpenTemplates}
        />
        <div className="flex-shrink-0 pt-4 border-t border-gray-700">
          <div className="flex gap-3">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Tapez votre message..."
              rows={3}
              className="flex-1 bg-gray-900 border-gray-600 text-white resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  onSendMessage(ticket.id);
                }
              }}
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => onSendMessage(ticket.id)}
                disabled={!newMessage.trim() || sendingMessage}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {sendingMessage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
              <Button variant="outline" size="icon" className="border-gray-600">
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Appuyez sur Cmd/Ctrl + Entrée pour envoyer</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
