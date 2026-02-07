'use client';

import {
  Copy,
  Share2,
  Download,
  Star,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { statusConfig, priorityConfig } from './constants';
import type { Ticket } from '@/lib/hooks/useSupport';
import type { SLA } from './types';
import { cn } from '@/lib/utils';

interface TicketDetailHeaderProps {
  ticket: Ticket;
  sla: SLA;
  formatDate: (date: Date | string) => string;
  onUpdateStatus: (ticketId: string, status: string) => void;
  onUpdatePriority: (ticketId: string, priority: string) => void;
  onOpenCSAT: () => void;
}

export function TicketDetailHeader({
  ticket,
  sla,
  formatDate,
  onUpdateStatus,
  onUpdatePriority,
  onOpenCSAT,
}: TicketDetailHeaderProps) {
  return (
    <DialogHeader className="flex-shrink-0">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className={statusConfig[ticket.status]?.bgColor}>
              {statusConfig[ticket.status]?.label}
            </Badge>
            <Badge variant="outline">{ticket.ticketNumber}</Badge>
            <Badge variant="outline" className={priorityConfig[ticket.priority]?.color}>
              {priorityConfig[ticket.priority]?.label}
            </Badge>
            {sla.status !== 'on-track' && (
              <Badge
                variant="outline"
                className={cn(
                  sla.status === 'breached' && 'border-red-500 text-red-400',
                  sla.status === 'at-risk' && 'border-yellow-500 text-yellow-400'
                )}
              >
                SLA {sla.status === 'breached' ? 'dépassé' : 'à risque'}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl">{ticket.subject}</DialogTitle>
          <DialogDescription className="text-gray-400 mt-2">
            {formatDate(ticket.createdAt)} • {ticket.messages?.length ?? 0} messages
          </DialogDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={ticket.status} onValueChange={(v) => onUpdateStatus(ticket.id, v)}>
            <SelectTrigger className="w-[150px] bg-gray-900 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="OPEN">Ouvert</SelectItem>
              <SelectItem value="IN_PROGRESS">En cours</SelectItem>
              <SelectItem value="WAITING_CUSTOMER">En attente</SelectItem>
              <SelectItem value="RESOLVED">Résolu</SelectItem>
              <SelectItem value="CLOSED">Fermé</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ticket.priority} onValueChange={(v) => onUpdatePriority(ticket.id, v)}>
            <SelectTrigger className="w-[150px] bg-gray-900 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="LOW">Basse</SelectItem>
              <SelectItem value="MEDIUM">Moyenne</SelectItem>
              <SelectItem value="HIGH">Haute</SelectItem>
              <SelectItem value="URGENT">Urgente</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="border-gray-600">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
              <DropdownMenuItem className="hover:bg-gray-700">
                <Copy className="w-4 h-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-700">
                <Share2 className="w-4 h-4 mr-2" />
                Partager
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-700">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem className="hover:bg-gray-700" onClick={onOpenCSAT}>
                <Star className="w-4 h-4 mr-2" />
                Évaluer
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-red-900/20 text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </DialogHeader>
  );
}
