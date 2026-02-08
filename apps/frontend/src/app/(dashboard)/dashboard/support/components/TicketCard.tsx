'use client';

import React from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Clock, MessageSquare, Tag, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { categoryConfig, priorityConfig, statusConfig } from './constants';
import { HelpCircle } from 'lucide-react';
import type { Ticket } from '@/lib/hooks/useSupport';
import type { SLA } from './types';
import { cn } from '@/lib/utils';

interface TicketCardProps {
  ticket: Ticket;
  index: number;
  sla: SLA;
  formatRelativeTime: (date: Date | string) => string;
  isSelected: boolean;
  hasSelectionMode: boolean;
  onSelect: (ticketId: string) => void;
  onView: (ticketId: string) => void;
}

export function TicketCard({
  ticket,
  index,
  sla,
  formatRelativeTime,
  isSelected,
  hasSelectionMode,
  onSelect,
  onView,
}: TicketCardProps) {
  const CategoryIcon = ticket.category ? categoryConfig[ticket.category]?.icon ?? HelpCircle : HelpCircle;

  const handleClick = () => {
    if (hasSelectionMode) onSelect(ticket.id);
    else onView(ticket.id);
  };

  return (
    <motion
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={cn(
          'p-4 bg-white border-gray-200 hover:border-gray-300 transition-all cursor-pointer border-l-4 relative',
          priorityConfig[ticket.priority]?.borderColor,
          isSelected && 'ring-2 ring-cyan-500'
        )}
        onClick={handleClick}
      >
        {hasSelectionMode && (
          <div className="absolute top-4 left-4 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(ticket.id)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={statusConfig[ticket.status]?.bgColor}>
                {statusConfig[ticket.status]?.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {ticket.ticketNumber}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {CategoryIcon && <CategoryIcon className="w-3 h-3" />}
                <span>{ticket.category ? categoryConfig[ticket.category]?.label : 'Non catégorisé'}</span>
              </div>
              {sla.status !== 'on-track' && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    sla.status === 'breached' && 'border-red-500 text-red-400',
                    sla.status === 'at-risk' && 'border-yellow-500 text-yellow-400'
                  )}
                >
                  SLA {sla.status === 'breached' ? 'dépassé' : 'à risque'}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 truncate mb-1">{ticket.subject}</h3>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{ticket.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(ticket.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {ticket.messages?.length ?? 0} messages
              </span>
              {ticket.tags && ticket.tags.length > 0 && (
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {ticket.tags.length} tags
                </span>
              )}
            </div>
            {sla.status !== 'on-track' && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Temps restant</span>
                  <span className={cn(sla.status === 'breached' ? 'text-red-400' : 'text-yellow-400')}>
                    {sla.resolutionTime.toFixed(1)}h
                  </span>
                </div>
                <Progress
                  value={Math.max(0, Math.min(100, (sla.resolutionTime / 24) * 100))}
                  className={cn(
                    'h-1.5',
                    sla.status === 'breached' && 'bg-red-500/20',
                    sla.status === 'at-risk' && 'bg-yellow-500/20'
                  )}
                />
              </div>
            )}
          </div>
          {!hasSelectionMode && <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />}
        </div>
      </Card>
    </motion>
  );
}
